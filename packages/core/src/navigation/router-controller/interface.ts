import { IAppSwitcher } from '../../app-switcher/app-switcher/interface';
import { IApp } from '../../application/app/interface';
import { createServiceSymbol } from '../../utils';
import { RouteOptions } from '../route/interface';

export const IRouterControllerKey = createServiceSymbol('IRouterController');

export interface IRouterController {
  isStarted: boolean;

  /** 增加路由配置信息 */
  addRoutes: (routes: RouteOptions[], app: IApp) => void;

  /** 增加路由拦截 */
  reroute: (navigationEvent?: Event) => void;

  start: (appSwitcher: IAppSwitcher) => void;
}
