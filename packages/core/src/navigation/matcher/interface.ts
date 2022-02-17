import { IApp } from '../../application/app/service';
import { createServiceSymbol } from '../../utils';
import { IRoute, MatchedRoute, RouteOptions } from '../route/service';

export const IMatcherKey = createServiceSymbol('IMatcher');

export interface IMatcher {
  /** 增加路由配置信息 */
  addRoutes: (routes: RouteOptions[], app: IApp) => void;

  /** 匹配路由 */
  match: (path: string, query: Record<string, string>, trees?: IRoute[], result?: MatchedRoute[]) => MatchedRoute[];
}
