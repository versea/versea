import { IApp } from '../../application/app/service';
import { createServiceSymbol } from '../../utils';
import { MatchedResult } from '../matcher/service';
import { RouteConfig } from '../route/service';

export const IRouterControllerKey = createServiceSymbol('IRouterController');

export interface IRouterController {
  /** 是否已经执行 start */
  readonly isStarted: boolean;

  /** 增加路由配置信息 */
  addRoutes: (routes: RouteConfig[], app: IApp) => void;

  /** 使用当前路径匹配路由 */
  match: (location?: Location) => MatchedResult;

  /** 增加路由拦截 */
  reroute: (navigationEvent?: Event) => Promise<void>;

  /**
   * 启动应用，注册完成所有应用后需要调用一次这个方法
   * @description 未启动应用时，路由匹配之后仅仅会 load App，不会 mount App；启动应用之后，路由匹配后 load App 并 mount App。
   */
  start: () => Promise<void>;
}
