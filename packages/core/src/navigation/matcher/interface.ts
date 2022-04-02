import queryString from 'query-string';

import { IApp } from '../../application/app/service';
import { createServiceSymbol } from '../../utils';
import { MatchedRoute, RouteOptions } from '../route/service';

export const IMatcherKey = createServiceSymbol('IMatcher');

export interface IMatcher {
  /** 增加路由配置信息 */
  addRoutes: (routes: RouteOptions[], app: IApp) => void;

  /** 匹配路由 */
  match: (path: string, query: queryString.ParsedQuery) => MatchedRoutes;
}

export interface MatchedRoutes {
  /** 匹配的路由信息 */
  routes: MatchedRoute[];

  /** 匹配的顶层碎片路由信息 */
  fragmentRoutes: MatchedRoute[];
}
