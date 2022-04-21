import { HookContext } from '@versea/tapable';
import queryString from 'query-string';

import { IApp } from '../../application/app/service';
import { createServiceSymbol } from '../../utils';
import { IRoute, MatchedRoute, RouteConfig } from '../route/service';

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

export interface MatchRoutesHookContext extends HookContext {
  path: string;
  query: queryString.ParsedQuery;
  matchRoute: (path: string, route: IRoute, params?: Record<string, string>) => boolean;
  routes: MatchedRoute[];
  fragmentRoutes: MatchedRoute[];
  trees: IRoute[];
  rootFragments: IRoute[];
}

export interface MatchRouteHookContext extends MatchRoutesHookContext {
  route: IRoute;
  params?: Record<string, string>;
  isMatched: boolean;
}
