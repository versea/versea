import { buildProviderModule, IApp, IMatcher, IStatus } from '@versea/core';
import { Container, interfaces } from 'inversify';

import { IPluginCustomMatchRoute } from '../index';

function createContainerWithPlugin(): Container {
  const container = new Container({ defaultScope: 'Singleton' });
  container.load(buildProviderModule(container));
  const plugin = container.get<IPluginCustomMatchRoute>(IPluginCustomMatchRoute);
  plugin.apply();
  return container;
}

function getAppInstance(container: Container, appName: string): IApp {
  const App = container.get<interfaces.Newable<IApp>>(IApp);
  // @ts-expect-error 这里需要向 App 传入构造函数参数
  return new App({ name: appName }, { Status: container.get(IStatus) });
}

/**
 * unit
 * @author shushan
 */
describe('PluginCustomMatchRoute', () => {
  test('rootFragmentRoute 类型传入 customMatchRoute, 匹配时应该是用 customMatchRoute 进行匹配', () => {
    const container = createContainerWithPlugin();
    const matcher = container.get<IMatcher>(IMatcher);
    matcher.addRoutes(
      [
        {
          path: 'path1',
          isRootFragment: true,
          customMatchRoute(path: string): boolean {
            return path === '/custom-match-root-fragment';
          },
        },
      ],
      getAppInstance(container, 'name1'),
    );

    expect(matcher.match('/custom-match-root-fragment', {}).fragmentRoutes).toMatchObject([
      {
        path: '/path1',
        apps: [
          {
            name: 'name1',
          },
        ],
      },
    ]);
  });

  test('rootFragmentRoute 类型不传入 customMatchRoute, 匹配时应该是用原来的 matchRoute 方法', () => {
    const container = createContainerWithPlugin();
    const matcher = container.get<IMatcher>(IMatcher);
    matcher.addRoutes(
      [
        {
          path: 'path1',
          isRootFragment: true,
        },
      ],
      getAppInstance(container, 'name1'),
    );

    expect(matcher.match('/custom-match-root-fragment', {}).fragmentRoutes).toMatchObject([]);
  });

  test('普通 route 类型传入 customMatchRoute, 应该报错', () => {
    const container = createContainerWithPlugin();
    const matcher = container.get<IMatcher>(IMatcher);
    expect(() => {
      matcher.addRoutes(
        [
          {
            path: 'path1',
            customMatchRoute(path: string): boolean {
              return path === '/custom-match-root-fragment';
            },
          },
        ],
        getAppInstance(container, 'name1'),
      );
    }).toThrowError();
  });
});
