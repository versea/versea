import { inject } from 'inversify';

import { IApp } from '../../application/app/service';
import { provide } from '../../provider';
import { IMatcher, IMatcherKey } from '../matcher/interface';
import { RouteOptions } from '../route/service';
import { IRouter, IRouterKey } from './interface';

export * from './interface';

@provide(IRouterKey)
export class Router implements IRouter {
  protected readonly _matcher: IMatcher;

  /** 标识是否已经给 navigationEvent 传入 router 的实例 */
  protected hasSetRouter = false;

  constructor(@inject(IMatcherKey) matcher: IMatcher) {
    this._matcher = matcher;
  }

  public addRoutes(routes: RouteOptions[], app: IApp): void {
    // 将 router 传给 navigationEvent
    if (!this.hasSetRouter) {
      // TODO: setRouter to navigationEvent
      this.hasSetRouter = true;
    }

    this._matcher.addRoutes(routes, app);
  }

  // TODO: add match method
  // public match() {
  //   return this._matcher.match();
  // }
}
