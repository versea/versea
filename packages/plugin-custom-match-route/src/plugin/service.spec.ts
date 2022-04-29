import { buildProviderModule, IApp, IAppKey, IMatcher, IMatcherKey, IStatusKey, VerseaContainer } from '@versea/core';
import { interfaces } from 'inversify';

import { IPluginCustomMatchRoute, IPluginCustomMatchRouteKey } from './service';

function createContainerWithPlugin(): VerseaContainer {
  const container = new VerseaContainer({ defaultScope: 'Singleton' });
  container.load(buildProviderModule());
  const plugin = container.get<IPluginCustomMatchRoute>(IPluginCustomMatchRouteKey);
  plugin.apply();
  return container;
}

function getAppInstance(container: VerseaContainer, appName: string): IApp {
  const App = container.get<interfaces.Newable<IApp>>(IAppKey);
  // @ts-expect-error 这里需要向 App 传入构造函数参数
  return new App({ name: appName }, { Status: container.get(IStatusKey) });
}

/**
 * unit
 * @author shushan
 */
describe('PluginCustomMatchRoute', () => {
  test('rootFragmentRoute 类型传入 customMatchRoute, 匹配时应该是用 customMatchRoute 进行匹配', () => {
    const container = createContainerWithPlugin();
    const matcher = container.get<IMatcher>(IMatcherKey);
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

  test('rootFragmentRoute 类型传入 customMatchRoute, 匹配时应该是用原来的 matchRoute 方法', () => {
    const container = createContainerWithPlugin();
    const matcher = container.get<IMatcher>(IMatcherKey);
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
});
