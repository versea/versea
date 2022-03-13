import { inject } from 'inversify';
import queryString from 'query-string';

import { IAppSwitcher } from '../../app-switcher/app-switcher/service';
import { IApp } from '../../application/app/service';
import { provide } from '../../provider';
import { IMatcher, IMatcherKey } from '../matcher/service';
import { capturedEventListeners, routingEventsListeningTo } from '../navigation-events';
import { EventName } from '../navigation-events/types';
import { MatchedRoute } from '../route/interface';
import { RouteOptions } from '../route/service';
import { IRouter, IRouterKey } from './interface';

export * from './interface';

@provide(IRouterKey)
export class Router implements IRouter {
  public isStarted = false;

  protected readonly _matcher: IMatcher;

  constructor(@inject(IMatcherKey) matcher: IMatcher) {
    this._matcher = matcher;
  }

  public addRoutes(routes: RouteOptions[], app: IApp): void {
    this._matcher.addRoutes(routes, app);
  }

  public match(): MatchedRoute[] {
    const path = location.pathname;
    const query = queryString.parse(location.search);
    return this._matcher.match(path, query);
  }

  public reroute(appSwitcher: IAppSwitcher, navigationEvent?: Event): void {
    const matched = this.match();
    void appSwitcher.switch({
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
            // event listener错误不应该中断versea的执行.
            setTimeout(() => {
              throw e;
            });
          }
        });
      }
    }
  }

  public start(appSwitcher: IAppSwitcher): void {
    this.reroute(appSwitcher);
  }
}
