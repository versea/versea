import { inject } from 'inversify';
import queryString from 'query-string';

import { IAppSwitcherKey, IAppSwitcher } from '../../app-switcher/app-switcher/service';
import { IAppService, IAppServiceKey } from '../../application/app-service/service';
import { IApp } from '../../application/app/service';
import { provide } from '../../provider';
import { IMatcher, IMatcherKey } from '../matcher/service';
import { setRouter, capturedEventListeners, routingEventsListeningTo } from '../navigation-events';
import { EventName } from '../navigation-events/types';
import { MatchedRoute } from '../route/interface';
import { RouteOptions } from '../route/service';
import { IRouter, IRouterKey } from './interface';

export * from './interface';

@provide(IRouterKey)
export class Router implements IRouter {
  public readonly _appService: IAppService;

  protected readonly _matcher: IMatcher;

  protected readonly _appSwitcher: IAppSwitcher;

  /** 标识是否已经给 navigationEvent 传入 router 的实例 */
  protected _hasBindRouter = false;

  constructor(
    @inject(IMatcherKey) matcher: IMatcher,
    @inject(IAppSwitcherKey) appSwitcher: IAppSwitcher,
    @inject(IAppServiceKey) appService: IAppService,
  ) {
    this._matcher = matcher;
    this._appSwitcher = appSwitcher;
    this._appService = appService;
  }

  public addRoutes(routes: RouteOptions[], app: IApp): void {
    // 将 router 传给 navigationEvent
    if (!this.hasBindRouter) {
      this.hasBindRouter = true;
      setRouter(this);
    }

    this._matcher.addRoutes(routes, app);
  }

  public match(): MatchedRoute[] {
    const path: string = location.pathname;
    const query: queryString.ParsedQuery = queryString.parse(location.search);
    return this._matcher.match(path, query);
  }

  public reroute(navigationEvent?: Event): void {
    const matched = this.match();
    void this._appSwitcher.switch({
      routes: matched,
      navigationEvent,
    });
  }

  public callCapturedEventListeners(eventArguments: [Event]): void {
    if (eventArguments) {
      const eventType = eventArguments[0].type as EventName;
      if (routingEventsListeningTo.includes(eventType)) {
        capturedEventListeners[eventType].forEach((listener: EventListener) => {
          try {
            listener.apply(this, eventArguments);
          } catch (e) {
            /**
             * event listener错误不应该中断versea的执行.
             */
            setTimeout(() => {
              throw e;
            });
          }
        });
      }
    }
  }
}
