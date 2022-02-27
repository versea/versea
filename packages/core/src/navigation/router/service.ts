import { inject } from 'inversify';

import { IAppSwitcherKey, IAppSwitcher } from '../../app-switcher/app-switcher/service';
import { IAppService, IAppServiceKey } from '../../application/app-service/interface';
import { IApp } from '../../application/app/service';
import { provide } from '../../provider';
import { getQuery } from '../../utils';
import { IMatcher, IMatcherKey } from '../matcher/service';
import { capturedEventListeners, routingEventsListeningTo, setRouter } from '../navigation-events';
import { EventName } from '../navigation-events/interface';
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
    if (!this._hasBindRouter) {
      this._hasBindRouter = true;
      setRouter(this);
    }

    this._matcher.addRoutes(routes, app);
  }

  public match(): MatchedRoute[] {
    /* eslint-disable @typescript-eslint/no-unsafe-assignment */
    /* eslint-disable @typescript-eslint/no-unsafe-member-access */
    const path: string = location.pathname;
    const query: Record<string, string> = getQuery();
    return this._matcher.match(path, query);
  }

  public reroute(eventArguments?: unknown[]): void {
    const matched = this.match();
    void this._appSwitcher.switch({
      routes: matched,
      eventArguments,
    });
  }

  public callCapturedEventListeners(eventArguments: [Event]): void {
    if (eventArguments) {
      const eventType = eventArguments[0].type as EventName;
      if (routingEventsListeningTo.includes(eventType)) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        capturedEventListeners[eventType].forEach((listener) => {
          try {
            listener.apply(this, eventArguments);
          } catch (e) {
            setTimeout(() => {
              throw e;
            });
          }
        });
      }
    }
  }
}
