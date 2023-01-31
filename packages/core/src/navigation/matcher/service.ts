/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { VerseaError } from '@versea/shared';
import { inject, interfaces } from 'inversify';
import { Key } from 'path-to-regexp';
import queryString from 'query-string';
import { flatten } from 'ramda';

import { IApp } from '../../application/app/interface';
import { VERSEA_INTERNAL_TAP } from '../../constants';
import { IHooks } from '../../hooks/interface';
import { provide } from '../../provider';
import { IRoute, RouteConfig, MatchedRoute } from '../route/interface';
import { IMatcher, MatchedResult, MatchRoutesHookContext } from './interface';

export * from './interface';

@provide(IMatcher)
export class Matcher implements IMatcher {
  /**
   * 普通路由
   * @description 数组的每一项都是路由树结构。
   */
  protected readonly _trees: IRoute[] = [];

  /**
   * 根部碎片路由
   * @description 渲染在主应用上的碎片应用对应的 Route。
   */
  protected readonly _rootFragments: IRoute[] = [];

  /** 普通路由深度优先遍历之后拍平的结构 */
  protected _routesList: IRoute[] = [];

  // eslint-disable-next-line @typescript-eslint/naming-convention
  protected readonly _RouteConstructor: interfaces.Newable<IRoute>;

  protected readonly _hooks: IHooks;

  // eslint-disable-next-line @typescript-eslint/naming-convention
  constructor(@inject(IRoute) Route: interfaces.Newable<IRoute>, @inject(IHooks) hooks: IHooks) {
    this._RouteConstructor = Route;
    this._hooks = hooks;

    this._initHooks();
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
    const { matchTree, matchFragment } = this._hooks;
    const matchRoutesHookContext = {
      path,
      query,
      matchRoute: (p: string, route: IRoute, params?: Record<string, string>): boolean =>
        this._matchRoute(p, route, params),
      routes: [],
      fragmentRoutes: [],
      trees: this._trees,
      routesList: this._routesList,
      rootFragments: this._rootFragments,
    };
    // 先匹配普通路由，再匹配根部碎片路由
    matchTree.call(matchRoutesHookContext);
    matchFragment.call(matchRoutesHookContext);

    return {
      routes: matchRoutesHookContext.routes,
      fragmentRoutes: matchRoutesHookContext.fragmentRoutes,
    };
  }

  protected _initHooks(): void {
    const { matchTree, matchFragment, matchRoute } = this._hooks;

    matchTree.tap(VERSEA_INTERNAL_TAP, (context) => {
      this._matchTree(context);
      this._addParentAppName(context.routes);
    });

    matchFragment.tap(VERSEA_INTERNAL_TAP, (context) => {
      this._matchFragment(context);
    });

    matchRoute.tap(VERSEA_INTERNAL_TAP, (context) => {
      context.isMatched = context.matchRoute(context.path, context.route, context.params);
    });
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

  protected _matchTree(context: MatchRoutesHookContext): void {
    for (const route of context.routesList) {
      const matchRouteHookContext = {
        ...context,
        route,
        params: {},
        isMatched: false,
      };
      this._hooks.matchRoute.call(matchRouteHookContext);

      if (matchRouteHookContext.isMatched) {
        let currentRoute: IRoute | null = route;
        while (currentRoute) {
          context.routes.unshift(
            currentRoute.toMatchedRoute({ params: matchRouteHookContext.params, query: context.query }),
          );
          currentRoute = currentRoute.parent;
        }
        return;
      }
    }
  }

  /** 在路由元信息中添加父应用名称 */
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

  protected _matchFragment(context: MatchRoutesHookContext): void {
    context.rootFragments.forEach((route) => {
      const matchRouteHookContext = {
        ...context,
        route,
        params: {},
        isMatched: false,
      };
      this._hooks.matchRoute.call(matchRouteHookContext);

      if (matchRouteHookContext.isMatched) {
        context.fragmentRoutes.push(
          route.toMatchedRoute({ params: matchRouteHookContext.params, query: context.query }),
        );
      }
    });
  }

  protected _matchRoute(path: string, route: IRoute, params?: Record<string, string>): boolean {
    const keys: Key[] = [];
    const matchArray = route.compile(keys).exec(path);

    // 检查路径是否具有重名的参数
    if (process.env.NODE_ENV !== 'production') {
      const keyMap = Object.create(null) as Record<string, boolean>;
      keys.forEach((key) => {
        if (keyMap[key.name]) {
          console.warn(`[versea]Duplicate param keys in route with path: "${route.path}"`);
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

    this._routesList = flatten(this._trees.map((item) => item.flatten()));
  }
}
