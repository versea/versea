import { HookContext } from '@versea/tapable';

import { ISwitcherStatus } from '../../enum/status';
import { IHooks } from '../../hooks/interface';
import { MatchedResult } from '../../navigation/matcher/interface';
import { MatchedRoute } from '../../navigation/route/interface';
import { IRouter } from '../../navigation/router/interface';
import { IStarter } from '../../starter/interface';
import { createServiceSymbol } from '../../utils';
import { ILoader } from '../loader/interface';
import { IRenderer } from '../renderer/interface';
import { IRouteState } from '../route-state/interface';

export const IAppSwitcherContextKey = createServiceSymbol('IAppSwitcherContext');

/**
 * 应用切换上下文
 * @description 执行 load app 和 mount app 和 unmount app。
 */
export interface IAppSwitcherContext extends HookContext {
  /** SwitcherContext 运行状态 */
  status: ISwitcherStatus[keyof ISwitcherStatus];

  /** 匹配的路由 */
  readonly matchedResult: MatchedResult;

  /** 路由状态 */
  readonly routeState: IRouteState;

  /** 当前的普通路由 */
  readonly currentRoutes: MatchedRoute[];

  /** 当前的根部碎片路由 */
  readonly currentRootFragmentRoutes: MatchedRoute[];

  /**
   * 开始切换应用
   * @description 仅仅执行一次，如果多次调用，返回第一次调用的结果
   */
  run: (options: RunOptions) => Promise<void>;

  /**
   * 取消切换应用
   * @description 仅仅执行一次，如果多次调用，返回第一次调用的结果
   */
  cancel: () => Promise<boolean>;

  /**
   * 运行异步任务
   * @description 将异步的函数包装成一个异步任务，会优先判断任务是否被取消。
   */
  runTask: <T>(fn: () => Promise<T>) => Promise<T>;

  /**
   * 确保当前任务没有被取消
   * @description 检查当前状态是不是 WaitForCancel，如果是抛出 VerseaCanceledError。
   */
  ensureNotCanceled: () => void;

  /** 调用存储的路由事件 */
  callEvent: () => void;
}

export interface RunOptions {
  loader: ILoader;
  renderer: IRenderer;
}

export interface AppSwitcherContextDependencies {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  SwitcherStatus: ISwitcherStatus;
  router: IRouter;
  routeState: IRouteState;
  hooks: IHooks;
  starter: IStarter;
}
