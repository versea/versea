import { IAppSwitcher } from '../../app-switcher/app-switcher/interface';
import { IApp } from '../../application/app/service';
import { createServiceSymbol } from '../../utils';
import { RouteOptions } from '../route/service';

export const IRouterKey = createServiceSymbol('IRouter');

export interface IRouter {
  /**
   * 是否已经执行 start
   */
  isStarted: boolean;

  /** 增加路由配置信息 */
  addRoutes: (routes: RouteOptions[], app: IApp) => void;

  /** 增加路由拦截 */
  reroute: (appSwitcher: IAppSwitcher, navigationEvent?: Event) => void;

  /**
   * 启动应用，注册完成所有应用后需要调用一次这个方法
   * @description 未启动应用时，路由匹配之后仅仅会 load App，而不会 mount App；启动应用之后，路由匹配后 load & mount App
   */
  start: (appSwitcher: IAppSwitcher) => void;
}
