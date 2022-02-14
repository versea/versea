/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { VerseaError } from '@versea/shared';
import { inject, interfaces } from 'inversify';
import { Key } from 'path-to-regexp';

import { IApp } from '../../application/app/service';
import { provide } from '../../provider';
import { IRoute, IRouteKey, MatchedRoute, RouteOptions } from '../route/service';
import { IMatcher, IMatcherKey } from './interface';

export * from './interface';

@provide(IMatcherKey)
export class Matcher implements IMatcher {
  protected trees: IRoute[] = [];

  // eslint-disable-next-line @typescript-eslint/naming-convention
  protected readonly _RouteConstructor: interfaces.Newable<IRoute>;

  // eslint-disable-next-line @typescript-eslint/naming-convention
  constructor(@inject(IRouteKey) Route: interfaces.Newable<IRoute>) {
    this._RouteConstructor = Route;
  }

  public addRoutes(routes: RouteOptions[], app: IApp): void {
    routes.forEach((routeOption) => {
      // @ts-expect-error 需要传入参数，但 inversify 这里的参数类型是 never
      const route = new this._RouteConstructor(routeOption, app);
      this.trees.push(route);
    });

    this.mergeTrees();
  }

  public match(
    path: string,
    query: Record<string, string>,
    trees: IRoute[] = this.trees,
    result: MatchedRoute[] = [],
  ): MatchedRoute[] {
    for (const route of trees) {
      const params: Record<string, string> = {};
      const isMatched = this.matchRoute(path, route, params);
      if (isMatched) {
        result.push(route.toMatchedRoute({ params, query }));
        return this.match(path, query, route.children, result);
      }
    }
    return result;
  }

  public matchRouteById(id: string, result: IRoute, trees: IRoute[] = this.trees): IRoute {
    for (const route of trees) {
      if (route.id === id) {
        result = route;
      } else {
        return this.matchRouteById(id, result, route.children);
      }
    }
    return result;
  }

  protected matchRoute(path: string, route: IRoute, params?: Record<string, string>): boolean {
    const keys: Key[] = [];
    const matchArray = route.compile(keys).exec(path);

    // 检查路径是否具有重名的参数
    if (process.env.NODE_ENV !== 'production') {
      const keyMap = Object.create(null) as Record<string, boolean>;
      keys.forEach((key) => {
        if (keyMap[key.name]) {
          console.warn(`Duplicate param keys in route with path: "${route.path}"`);
        }
        keyMap[key.name] = true;
      });
    }

    if (!matchArray) {
      return false;
    }

    if (params) {
      for (let i = 1, len = matchArray.length; i < len; ++i) {
        const key = keys[i - 1];
        if (key) {
          // 匹配 wildcard(.*) 时，使用 pathMatch 表示
          params[key.name || 'pathMatch'] =
            typeof matchArray[i] === 'string' ? decodeURIComponent(matchArray[i]) : matchArray[i];
        }
      }
    }

    return true;
  }

  /** 合并路由树 */
  protected mergeTrees(): void {
    // 生成 slotMap，记录所有允许插入的节点
    const slotMap: Record<string, IRoute> = {};
    this.trees.forEach((tree) => {
      tree.slotRoutes.forEach((route) => {
        if (slotMap[route.slot!]) {
          throw new VerseaError(`Duplicate slot key in route with path: "${route.path}".`);
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
