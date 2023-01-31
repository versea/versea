import { HookContext } from '@versea/tapable';
import queryString from 'query-string';

import { IApp } from '../../application/app/interface';
import { createServiceSymbol } from '../../utils';
import { IRoute, MatchedRoute, RouteConfig } from '../route/interface';

export const IMatcher = createServiceSymbol('IMatcher');

export interface IMatcher {
  /** 增加路由 */
  addRoutes: (routes: RouteConfig[], app: IApp) => void;

  /** 匹配路由 */
  match: (path: string, query: queryString.ParsedQuery) => MatchedResult;
}

export interface MatchedResult {
  /** 普通路由的匹配结果 */
  routes: MatchedRoute[];

  /** 根部碎片路由的匹配结果 */
  fragmentRoutes: MatchedRoute[];
}

export interface MatchRoutesHookContext extends HookContext {
  /** 当前路径 */
  path: string;

  /** 当前解析的 query */
  query: queryString.ParsedQuery;

  /** 普通路由树 */
  trees: IRoute[];

  /**
   * 普通路由树深度优先遍历的数组
   * @description 一般使用这个数据匹配路由
   */
  routesList: IRoute[];

  /** 根部碎片路由 */
  rootFragments: IRoute[];

  matchRoute: (path: string, route: IRoute, params?: Record<string, string>) => boolean;

  /** 普通路由的匹配结果 */
  routes: MatchedRoute[];

  /** 根部碎片路由的匹配结果 */
  fragmentRoutes: MatchedRoute[];
}

export interface MatchRouteHookContext extends MatchRoutesHookContext {
  route: IRoute;

  /** 执行匹配之后获取的 params */
  params?: Record<string, string>;

  /** 执行匹配的结果 */
  isMatched: boolean;
}
