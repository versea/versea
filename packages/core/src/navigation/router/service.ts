import { inject } from 'inversify';
import { parse } from 'query-string';

import { IAppSwitcher, IAppSwitcherKey } from '../../app-switcher/app-switcher/interface';
import { IApp } from '../../application/app/service';
import { lazyInject, provide } from '../../provider';
import { IMatcher, IMatcherKey, MatchedResult } from '../matcher/service';
import { bindRouter, callCapturedEventListeners } from '../navigation-events';
import { RouteConfig } from '../route/service';
import { IRouter, IRouterKey } from './interface';

export * from './interface';

@provide(IRouterKey)
export class Router implements IRouter {
  @lazyInject(IAppSwitcherKey) protected readonly _appSwitcher!: IAppSwitcher;

  public isStarted = false;

  protected readonly _matcher: IMatcher;

  /** 标识是否已经把 router 传给 navigation */
  protected _hasBindRouter = false;

  constructor(@inject(IMatcherKey) matcher: IMatcher) {
    this._matcher = matcher;
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
    await this._appSwitcher.switch({
      navigationEvent,
      matchedResult: this.match(),
    });
  }

  public callCapturedEventListeners(navigationEvent?: Event): void {
    callCapturedEventListeners(navigationEvent);
  }

  public async start(): Promise<void> {
    if (this.isStarted) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Versea has already started, it should not start again.');
        return;
      }
    }

    this.isStarted = true;
    return this.reroute();
  }
}
