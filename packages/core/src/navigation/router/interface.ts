import { IAppSwitcher } from '../../app-switcher/app-switcher/service';
import { IApp } from '../../application/app/service';
import { createServiceSymbol } from '../../utils';
import { MatchedRoutes } from '../matcher/service';
import { RouteOptions } from '../route/service';

export const IRouterKey = createServiceSymbol('IRouter');

export interface IRouter {
  /** 是否已经执行 start */
  isStarted: boolean;

  /** 增加路由配置信息 */
  addRoutes: (routes: RouteOptions[], app: IApp) => void;

  /** 使用当前路径匹配路由 */
  match: (location?: Location) => MatchedRoutes;

  /** 增加路由拦截 */
  reroute: (appSwitcher: IAppSwitcher, navigationEvent?: Event) => Promise<void>;

  /** 调用 popstate 或 hashchange 事件监听函数 */
  callCapturedEventListeners: (navigationEvent?: Event) => void;

  /** 启动应用 */
  start: (appSwitcher: IAppSwitcher) => Promise<void>;
}
