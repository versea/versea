import queryString from 'query-string';

import { IApp } from '../../application/app/service';
import { createServiceSymbol } from '../../utils';
import { MatchedRoute, RouteConfig } from '../route/service';

export const IMatcherKey = createServiceSymbol('IMatcher');

export interface IMatcher {
  /** 增加路由 */
  addRoutes: (routes: RouteConfig[], app: IApp) => void;

  /** 匹配路由 */
  match: (path: string, query: queryString.ParsedQuery) => MatchedResult;
}

export interface MatchedResult {
  /** 匹配的普通路由结果 */
  routes: MatchedRoute[];

  /** 匹配的根部碎片路由结果 */
  fragmentRoutes: MatchedRoute[];
}
