import { Route, IHooks, provide, VERSEA_INTERNAL_TAP } from '@versea/core';
import { inject } from 'inversify';

import { IPluginCustomMatchRoute } from './interface';

export * from './interface';

@provide(IPluginCustomMatchRoute)
export class PluginCustomMatchRoute implements IPluginCustomMatchRoute {
  protected _hooks: IHooks;

  constructor(@inject(IHooks) hooks: IHooks) {
    this._hooks = hooks;
  }

  public apply(): void {
    this._hooks.matchRoute.tap(
      VERSEA_INTERNAL_TAP,
      (context) => {
        const { path, route, params, matchRoute } = context;
        if (route.customMatchRoute) {
          context.isMatched = route.customMatchRoute(path, route, params);
        } else {
          context.isMatched = matchRoute(path, route, params);
        }
      },
      { replace: true },
    );
  }
}

// customMatchRoute 信息在 IRoute 上保存，在路由匹配时调用
Route.defineProp('customMatchRoute', {
  validator: (customMatchRoute, routeConfig) => !customMatchRoute || !!routeConfig.isRootFragment,
  onClone: () => undefined,
});

declare module '@versea/core' {
  /** Route 实例化的参数 */
  export interface RouteConfig {
    /** 根部碎片路由的自定义路由匹配函数 */
    customMatchRoute?: (path: string, route: IRoute, params?: Record<string, string>) => boolean;
  }

  export interface IRoute {
    /** 根部碎片路由的自定义路由匹配函数 */
    customMatchRoute?: (path: string, route: IRoute, params?: Record<string, string>) => boolean;
  }
}
