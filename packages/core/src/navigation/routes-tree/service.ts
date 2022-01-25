import { inject, interfaces } from 'inversify';

import { IApp } from '../../application/app/service';
import { provide } from '../../provider';
import { IRoute, IRouteKey, RouteOptions } from '../route/service';
import { IRoutesTree, IRoutesTreeKey } from './interface';

export * from './interface';

@provide(IRoutesTreeKey)
export class RoutesTree implements IRoutesTree {
  protected fragments: IRoute[] = [];

  private readonly _RouteConstructor: interfaces.Newable<IRoute>;

  // eslint-disable-next-line @typescript-eslint/naming-convention
  constructor(@inject(IRouteKey) Route: interfaces.Newable<IRoute>) {
    this._RouteConstructor = Route;
  }

  public createTree(options: RouteOptions, app: IApp): IRoute {
    // @ts-expect-error 需要传入参数，但 inversify 这里的参数类型是 never
    const route = new this._RouteConstructor(options, app);
    this.fragments.push(route);
    return route;
  }
}
