import { inject, interfaces } from 'inversify';

import { IApp } from '../../application/app/service';
import { provide } from '../../provider';
import { IRoute, IRouteKey, RouteOptions } from '../route/service';
import { IRouteTrees, IRouteTreesKey } from './interface';

export * from './interface';

@provide(IRouteTreesKey)
export class RouteTrees implements IRouteTrees {
  protected fragments: IRoute[] = [];

  private readonly _RouteConstructor: interfaces.Newable<IRoute>;

  // eslint-disable-next-line @typescript-eslint/naming-convention
  constructor(@inject(IRouteKey) Route: interfaces.Newable<IRoute>) {
    this._RouteConstructor = Route;
  }

  public createTree(options: RouteOptions[], app: IApp): void {
    options.forEach((routeOptions) => {
      // @ts-expect-error 需要传入参数，但 inversify 这里的参数类型是 never
      const route = new this._RouteConstructor(routeOptions, app);
      this.fragments.push(route);
    });

    this.mergeFragments();
  }

  // TODO: 合并两个路由树
  protected mergeFragments(): void {
    console.log(this.fragments);
  }
}
