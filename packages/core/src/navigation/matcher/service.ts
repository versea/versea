/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { VerseaError } from '@versea/shared';
import { inject, interfaces } from 'inversify';
import { Key } from 'path-to-regexp';
import queryString from 'query-string';

import { IApp } from '../../application/app/service';
import { provide } from '../../provider';
import { IRoute, IRouteKey, RouteConfig, MatchedRoute } from '../route/service';
import { IMatcher, IMatcherKey, MatchedResult } from './interface';

export * from './interface';

@provide(IMatcherKey)
export class Matcher implements IMatcher {
  /**
   * 普通路由树
   * @description 数组的每一项都是树结构。
   */
  protected readonly _trees: IRoute[] = [];

  /**
   * 根部碎片路由数组
   * @description 数组的每一项都是一个没有 children 的 Route。
   */
  protected readonly _rootFragments: IRoute[] = [];

  // eslint-disable-next-line @typescript-eslint/naming-convention
  protected readonly _RouteConstructor: interfaces.Newable<IRoute>;

  // eslint-disable-next-line @typescript-eslint/naming-convention
  constructor(@inject(IRouteKey) Route: interfaces.Newable<IRoute>) {
    this._RouteConstructor = Route;
  }

  public addRoutes(routes: RouteConfig[], app: IApp): void {
    routes.forEach((routeConfig) => {
      // @ts-expect-error 需要传入参数，但 inversify 这里的参数类型是 never
      const route = new this._RouteConstructor(routeConfig, app);
      if (!routeConfig.isRootFragment) {
        this._trees.push(route);
      } else {
        this._rootFragments.push(route);
      }
    });

    this._mergeTrees();
  }

  public match(path: string, query: queryString.ParsedQuery): MatchedResult {
    return {
      routes: this._matchTree(path, query),
      fragmentRoutes: this._matchFragment(path, query),
    };
  }

  protected _matchTree(
    path: string,
    query: queryString.ParsedQuery,
    trees: IRoute[] = this._trees,
    result: MatchedRoute[] = [],
  ): MatchedRoute[] {
    for (const route of trees) {
      const params: Record<string, string> = {};
      const isMatched = this._matchRoute(path, route, params);
      if (isMatched) {
        const parentAppName = this._getParentAppName(result, route);
        result.push(route.toMatchedRoute({ params, query }, parentAppName));
        return this._matchTree(path, query, route.children, result);
      }
    }

    return result;
  }

  /** 获取嵌套路由的父应用名称 */
  protected _getParentAppName(routes: MatchedRoute[], route: IRoute): string | undefined {
    const lastRoute = routes[routes.length - 1];
    if (!lastRoute || lastRoute.apps[0] === route.apps[0]) {
      return;
    }
    return lastRoute.apps[0].name;
  }

  protected _matchFragment(path: string, query: queryString.ParsedQuery): MatchedRoute[] {
    const result: MatchedRoute[] = [];
    this._rootFragments.forEach((route) => {
      const params: Record<string, string> = {};
      const isMatched = this._matchRoute(path, route, params);
      if (isMatched) {
        result.push(route.toMatchedRoute({ params, query }));
      }
    });
    return result;
  }

  protected _matchRoute(path: string, route: IRoute, params?: Record<string, string>): boolean {
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
  protected _mergeTrees(): void {
    // 生成 slotMap，记录所有允许插入的节点
    const slotMap: Record<string, IRoute> = {};
    this._trees.forEach((tree) => {
      tree.slotRoutes.forEach((route) => {
        if (slotMap[route.slot!]) {
          throw new VerseaError(`Duplicate slot key in route with path: "${route.path}".`);
        }
        slotMap[route.slot!] = route;
      });
    });

    // 根据 slot 和 fill 合并路由树
    for (let i = this._trees.length - 1; i >= 0; i--) {
      const tree = this._trees[i];
      if (tree.fill && slotMap[tree.fill]) {
        slotMap[tree.fill].appendChild(tree);
        this._trees.splice(i, 1);
      }
    }

    // 合并多个 Tree 的拫节点
    for (let i = 0; i < this._trees.length; i++) {
      const tree = this._trees[i];
      for (let j = this._trees.length - 1; j > i; j--) {
        const otherTree = this._trees[j];
        if (tree.path === otherTree.path) {
          tree.merge(otherTree);
          this._trees.splice(j, 1);
        }
      }
    }
  }
}
