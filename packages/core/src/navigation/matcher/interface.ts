import { IApp } from '../../application/app/interface';
import { createServiceSymbol } from '../../utils';
import { MatchedRoute, RouteOptions } from '../route/service';

export const IMatcherKey = createServiceSymbol('IMatcher');

export interface IMatcher {
  /** 增加路由配置信息 */
  addRoutes: (routes: RouteOptions[], app: IApp) => void;

  /** 匹配路由 */
  match: (path: string) => MatchedRoute[];
}
