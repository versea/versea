/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { VerseaError } from '@versea/shared';
import { inject, interfaces } from 'inversify';

import { IApp } from '../../application/app/service';
import { provide } from '../../provider';
import { IRoute, IRouteKey, RouteOptions } from '../route/service';
import { IRouteTrees, IRouteTreesKey } from './interface';

export * from './interface';

@provide(IRouteTreesKey)
export class RouteTrees implements IRouteTrees {
  protected trees: IRoute[] = [];

  private readonly _RouteConstructor: interfaces.Newable<IRoute>;

  // eslint-disable-next-line @typescript-eslint/naming-convention
  constructor(@inject(IRouteKey) Route: interfaces.Newable<IRoute>) {
    this._RouteConstructor = Route;
  }

  public createTree(options: RouteOptions[], app: IApp): void {
    options.forEach((routeOptions) => {
      // @ts-expect-error 需要传入参数，但 inversify 这里的参数类型是 never
      const route = new this._RouteConstructor(routeOptions, app);
      this.trees.push(route);
    });

    this.mergeTrees();
  }

  /** 合并路由树 */
  protected mergeTrees(): void {
    // 生成 slotMap，记录所有允许插入的节点
    const slotMap: Record<string, IRoute> = {};
    this.trees.forEach((tree) => {
      tree.slotRoutes.forEach((route) => {
        if (slotMap[route.slot!]) {
          throw new VerseaError(`Duplicate slot key in route with path: "${route.path}"`);
        }
        slotMap[route.slot!] = route;
      });
    });

    for (let i = this.trees.length - 1; i >= 0; i--) {
      const tree = this.trees[i];
      if (tree.fill && slotMap[tree.fill]) {
        slotMap[tree.fill].appendChild(tree);
        this.trees.splice(i, 1);
      }
    }
  }
}
