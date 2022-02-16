import { inject } from 'inversify';

import { IApp } from '../../application/app/service';
import { IPerformanceKey, IPerformance } from '../../performance/performance/service';
import { provide } from '../../provider';
import { IMatcher, IMatcherKey } from '../matcher/service';
import { RouteOptions } from '../route/service';
import { IRouter, IRouterKey } from './interface';

export * from './interface';

@provide(IRouterKey)
export class Router implements IRouter {
  protected readonly _matcher: IMatcher;

  protected readonly _performance: IPerformance;

  /** 标识是否已经给 navigationEvent 传入 router 的实例 */
  protected hasBindRouter = false;

  constructor(@inject(IMatcherKey) matcher: IMatcher, @inject(IPerformanceKey) performance: IPerformance) {
    this._matcher = matcher;
    this._performance = performance;
  }

  public addRoutes(routes: RouteOptions[], app: IApp): void {
    // 将 router 传给 navigationEvent
    if (!this.hasBindRouter) {
      // TODO: setRouter to navigationEvent
      this.hasBindRouter = true;
    }

    this._matcher.addRoutes(routes, app);
  }

  // TODO: add match method
  // public match() {
  //   return this._matcher.match();
  // }
}
