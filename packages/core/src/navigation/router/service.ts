import { inject } from 'inversify';
import queryString, { parse, parseUrl } from 'query-string';

import { IAppSwitcher, IAppSwitcherKey } from '../../app-switcher/app-switcher/interface';
import { IApp } from '../../application/app/interface';
import { IConfigKey, IConfig } from '../../config';
import { VERSEA_INTERNAL_TAP } from '../../constants';
import { IHooks, IHooksKey } from '../../hooks/interface';
import { lazyInject, provide } from '../../provider';
import { IStarter, IStarterKey } from '../../starter/interface';
import { IMatcher, IMatcherKey, MatchedResult } from '../matcher/interface';
import { bindRouter, callCapturedEventListeners } from '../navigation-events';
import { RouteConfig } from '../route/interface';
import { IRouter, IRouterKey } from './interface';

export * from './interface';

@provide(IRouterKey)
export class Router implements IRouter {
  @lazyInject(IStarterKey) protected readonly _starter!: IStarter;

  @lazyInject(IAppSwitcherKey) protected readonly _appSwitcher!: IAppSwitcher;

  protected readonly _matcher: IMatcher;

  protected readonly _hooks: IHooks;

  protected readonly _config: IConfig;

  /** 标识是否已经把 router 传给 navigation */
  protected _hasBindRouter = false;

  constructor(
    @inject(IMatcherKey) matcher: IMatcher,
    @inject(IHooksKey) hooks: IHooks,
    @inject(IConfigKey) config: IConfig,
  ) {
    this._matcher = matcher;
    this._hooks = hooks;
    this._config = config;

    this._initHooks();
  }

  public get isStarted(): boolean {
    return this._starter.isStarted;
  }

  public addRoutes(routes: RouteConfig[], app: IApp): void {
    this._matcher.addRoutes(routes, app);
    if (!this._hasBindRouter) {
      this._hasBindRouter = true;
      // 把 router 传给 navigation
      bindRouter(this);
    }
  }

  public match(): MatchedResult {
    const { path, query } = this._getLocation();
    // 匹配路由时，需要再末尾加上 "/"
    return this._matcher.match(path.endsWith('/') ? path : `${path}/`, query);
  }

  public async reroute(navigationEvent?: Event): Promise<void> {
    const rerouteHookContext = {
      navigationEvent,
      matchedResult: this.match(),
    };
    await this._hooks.reroute.call(rerouteHookContext);
  }

  public callCapturedEventListeners(navigationEvent?: Event): void {
    callCapturedEventListeners(navigationEvent);
  }

  protected _getLocation(): { path: string; query: queryString.ParsedQuery } {
    if (this._config.routerMode === 'hash') {
      const fullPath = window.location.hash.substring(1);
      const { url, query } = parseUrl(fullPath);
      return {
        path: url,
        query,
      };
    }
    return {
      path: window.location.pathname,
      query: parse(window.location.search),
    };
  }

  protected _initHooks(): void {
    this._hooks.reroute.tap(VERSEA_INTERNAL_TAP, async (context) => {
      await this._appSwitcher.switch({
        navigationEvent: context.navigationEvent,
        matchedResult: context.matchedResult,
      });
    });
  }
}
