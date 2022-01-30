import { IApp } from '../../application/app/interface';
import { createServiceSymbol } from '../../utils';
import { RouteOptions } from '../route/service';

export const IRouterKey = createServiceSymbol('IRouter');

export interface IRouter {
  /** 增加路由配置信息 */
  addRoutes: (routes: RouteOptions[], app: IApp) => void;
}
