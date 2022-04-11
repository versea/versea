import { IAppSwitcher } from '../../app-switcher/app-switcher/service';
import { IApp } from '../../application/app/service';
import { createServiceSymbol } from '../../utils';
import { MatchedResult } from '../matcher/service';
import { RouteConfig } from '../route/service';

export const IRouterKey = createServiceSymbol('IRouter');

export interface IRouter {
  /** 是否已经执行 start */
  isStarted: boolean;

  /** 增加路由 */
  addRoutes: (routes: RouteConfig[], app: IApp) => void;

  /** 使用当前路径匹配路由 */
  match: (location?: Location) => MatchedResult;

  /** 主动执行路由匹配和应用切换 */
  reroute: (appSwitcher: IAppSwitcher, navigationEvent?: Event) => Promise<void>;

  /** 调用 popstate 或 hashchange 事件监听函数 */
  callCapturedEventListeners: (navigationEvent?: Event) => void;

  /** 启动应用 */
  start: (appSwitcher: IAppSwitcher) => Promise<void>;
}
