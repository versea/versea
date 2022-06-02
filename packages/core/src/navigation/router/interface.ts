import { HookContext } from '@versea/tapable';

import { IApp } from '../../application/app/interface';
import { createServiceSymbol } from '../../utils';
import { MatchedResult } from '../matcher/interface';
import { RouteConfig } from '../route/interface';

export const IRouter = createServiceSymbol('IRouter');

export interface IRouter {
  /**
   * starter 状态
   * @see IStarter#isStarted
   */
  readonly isStarted: boolean;

  /** 增加路由 */
  addRoutes: (routes: RouteConfig[], app: IApp) => void;

  /** 使用当前路径匹配路由 */
  match: () => MatchedResult;

  /** 执行路由匹配和应用切换 */
  reroute: (navigationEvent?: Event) => Promise<void>;

  /** 调用 popstate 或 hashchange 的事件监听函数 */
  callCapturedEventListeners: (navigationEvent?: Event) => void;
}

export interface RerouteHookContext extends HookContext {
  navigationEvent?: Event;
  matchedResult: MatchedResult;
}
