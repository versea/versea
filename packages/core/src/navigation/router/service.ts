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

  constructor(@inject(IMatcherKey) matcher: IMatcher) {
    this._matcher = matcher;
  }

  public addRoutes(routes: RouteOptions[], app: IApp): void {
    this._matcher.addRoutes(routes, app);
  }

  // TODO: add match method
  // public match() {
  //   return this._matcher.match();
  // }
}
