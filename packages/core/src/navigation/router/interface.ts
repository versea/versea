import { IAppService } from '../../application/app-service/interface';
import { IApp } from '../../application/app/service';
import { createServiceSymbol } from '../../utils';
import { RouteOptions } from '../route/service';

export const IRouterKey = createServiceSymbol('IRouter');

export interface IRouter {
  /** 增加路由配置信息 */
  addRoutes: (routes: RouteOptions[], app: IApp) => void;

  /** 增加路由拦截 */
  reroute: (navigationEvent?: Event) => void;

  _appService: IAppService;
}
