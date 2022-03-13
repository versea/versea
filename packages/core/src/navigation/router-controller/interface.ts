import { IAppSwitcher } from '../../app-switcher/app-switcher/interface';
import { IApp } from '../../application/app/interface';
import { createServiceSymbol } from '../../utils';
import { RouteOptions } from '../route/interface';
import { IRouter } from '../router/interface';

export const IRouterControllerKey = createServiceSymbol('IRouterController');

export interface IRouterController {
  /** 暴露_router, navigation中需要获取到router的isStarted属性 */
  _router: IRouter;

  /** 增加路由配置信息 */
  addRoutes: (routes: RouteOptions[], app: IApp) => void;

  /** 增加路由拦截 */
  reroute: (navigationEvent?: Event) => void;

  start: (appSwitcher: IAppSwitcher) => void;
}
