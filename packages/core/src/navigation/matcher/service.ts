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
   * 普通路由
   * @description 数组的每一项都是路由树结构。
   */
  protected readonly _trees: IRoute[] = [];

  /**
   * 根部碎片路由
   * @description 数组的每一项都是一个仅有空 children 的 Route。
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
        this._appendTree(route);
      } else {
        this._rootFragments.push(route);
      }
    });

    this._mergeTrees();
  }

  public match(path: string, query: queryString.ParsedQuery): MatchedResult {
    const routes = this._matchTree(path, query);
    // 补充 parentAppName
    this._addParentAppName(routes);
    return {
      routes: routes,
      fragmentRoutes: this._matchFragment(path, query),
    };
  }

  /** 向普通路由中添加路由树 */
  protected _appendTree(route: IRoute): void {
    // 路径是 "/(.*)" 的路由节点放在最后
    const wildIndex = this._trees.findIndex((tree) => ['/(.*)'].includes(tree.path));
    if (wildIndex < 0) {
      this._trees.push(route);
      return;
    }
    this._trees.splice(wildIndex, 0, route);
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
        result.push(route.toMatchedRoute({ params, query }));
        return this._matchTree(path, query, route.children, result);
      }
    }

    return result;
  }

  /** 获取嵌套路由的父应用名称 */
  protected _addParentAppName(routes: MatchedRoute[]): void {
    if (routes.length <= 1) {
      return;
    }
    for (let i = 1; i < routes.length; i++) {
      const parentAppLike = routes[i - 1].apps[0];
      if (parentAppLike !== routes[i].apps[0]) {
        routes[i].meta.parentAppName = parentAppLike.name;
      }
    }
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
