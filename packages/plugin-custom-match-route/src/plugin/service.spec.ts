/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { buildProviderModule, IApp, IAppKey, IMatcher, IMatcherKey, IStatusKey } from '@versea/core';
import { Container, interfaces } from 'inversify';

import { IPluginCustomMatchRoute, IPluginCustomMatchRouteKey } from './service';

interface BasicConfigResponse {
  matcher: IMatcher;
  plugin: IPluginCustomMatchRoute;
  app: IApp;
}

function getBasicConfig(appName: string): BasicConfigResponse {
  const container = new Container({ defaultScope: 'Singleton' });
  container.load(buildProviderModule());
  const matcher = container.get<IMatcher>(IMatcherKey);
  const plugin = container.get<IPluginCustomMatchRoute>(IPluginCustomMatchRouteKey);
  const App = container.get<interfaces.Newable<IApp>>(IAppKey);
  // @ts-expect-error 这里需要向 App 传入构造函数参数
  const app = new App({ name: appName }, { Status: container.get(IStatusKey) });
  return {
    matcher,
    plugin,
    app,
  };
}
/**
 * unit
 * @author shushan
 */
describe('Custom Match Route', () => {
  test('PluginCustomMatchRoute 启动后, 若 Route 既是 rootFragment 且有 customMatchRoute , 匹配时应该是用 customMatchRoute 进行匹配', () => {
    const { matcher, plugin, app } = getBasicConfig('name1');
    const customMatchRoute = (path: string): boolean => {
      if (path === '/custom-match-root-fragment') {
        return true;
      }
      return false;
    };
    matcher.addRoutes(
      [
        {
          path: 'path1',
          isRootFragment: true,
          customMatchRoute,
        },
      ],
      app,
    );

    plugin.apply();

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

  test('PluginCustomMatchRoute 启动后, 若 Route 既是 rootFragment 且没有 customMatchRoute , 匹配时应该是用原来的 matchRoute 方法', () => {
    const { matcher, plugin, app } = getBasicConfig('name1');
    matcher.addRoutes(
      [
        {
          path: 'path1',
          isRootFragment: true,
        },
      ],
      app,
    );

    plugin.apply();

    expect(matcher.match('/custom-match-root-fragment', {}).fragmentRoutes).toMatchObject([]);
  });
});
