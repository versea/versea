import { IAppSwitcher } from '../../app-switcher/app-switcher/service';
import { IApp } from '../../application/app/service';
import { createServiceSymbol } from '../../utils';
import { MatchedRoutes } from '../matcher/service';
import { RouteConfig } from '../route/service';

export const IRouterKey = createServiceSymbol('IRouter');

export interface IRouter {
  /** 增加路由 */
  addRoutes: (routes: RouteConfig[], app: IApp) => void;

  /** 使用当前路径匹配路由 */
  match: (location?: Location) => MatchedRoutes;

  /** 主动执行路由匹配和应用切换 */
  reroute: (appSwitcher: IAppSwitcher, navigationEvent?: Event) => Promise<void>;

  /** 调用 popstate 或 hashchange 事件监听函数 */
  callCapturedEventListeners: (navigationEvent?: Event) => void;
}
