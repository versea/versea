import { inject } from 'inversify';
import { parse } from 'query-string';

import { IAppSwitcher, IAppSwitcherKey } from '../../app-switcher/app-switcher/interface';
import { IApp } from '../../application/app/service';
import { VERSEA_INTERNAL_TAP } from '../../constants';
import { IHooks, IHooksKey } from '../../hooks/service';
import { lazyInject, provide } from '../../provider';
import { IStarter, IStarterKey } from '../../starter/service';
import { IMatcher, IMatcherKey, MatchedResult } from '../matcher/service';
import { bindRouter, callCapturedEventListeners } from '../navigation-events';
import { RouteConfig } from '../route/service';
import { IRouter, IRouterKey } from './interface';

export * from './interface';

@provide(IRouterKey)
export class Router implements IRouter {
  @lazyInject(IStarterKey) protected readonly _starter!: IStarter;

  @lazyInject(IAppSwitcherKey) protected readonly _appSwitcher!: IAppSwitcher;

  protected readonly _matcher: IMatcher;

  protected readonly _hooks: IHooks;

  /** 标识是否已经把 router 传给 navigation */
  protected _hasBindRouter = false;

  constructor(@inject(IMatcherKey) matcher: IMatcher, @inject(IHooksKey) hooks: IHooks) {
    this._matcher = matcher;
    this._hooks = hooks;

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
    // TODO: handle hash mode
    const path = window.location.pathname;
    const query = parse(window.location.search);
    // 匹配路由时，需要再末尾加上 "/"
    return this._matcher.match(path.endsWith('/') ? path : `${path}/`, query);
  }

  public async reroute(navigationEvent?: Event): Promise<void> {
    const rerouteHookContext = {
      navigationEvent,
      matchedResult: this.match(),
      bail: false,
    };
    await this._hooks.reroute.call(rerouteHookContext);
  }

  public callCapturedEventListeners(navigationEvent?: Event): void {
    callCapturedEventListeners(navigationEvent);
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
