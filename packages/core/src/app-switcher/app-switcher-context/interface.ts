import { IActionType, IActionTargetType } from '../../constants/action';
import { ISwitcherStatus } from '../../constants/status';
import { MatchedResult } from '../../navigation/matcher/service';
import { IRouter } from '../../navigation/router/service';
import { createServiceSymbol } from '../../utils';
import { ILogicLoader } from '../logic-loader/service';
import { IRenderer } from '../logic-renderer/service';

export const IAppSwitcherContextKey = createServiceSymbol('IAppSwitcherContext');

/**
 * 应用切换上下文
 * @description 执行 load app 和 mount app 和 unmount app
 */
export interface IAppSwitcherContext {
  /** SwitcherContext 运行状态 */
  status: ISwitcherStatus[keyof ISwitcherStatus];

  /** 匹配的路由 */
  readonly matchedResult: MatchedResult;

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
   * 运行事务
   * @description 将异步的函数包装成一个异步事务并运行，确保在取消和运行报错情况下都能保持 SwitcherContext 的状态正确
   */
  runTransaction: <T>(fn: () => Promise<T>, onError?: (error: unknown) => void, onCancel?: () => void) => Promise<T>;
}

export interface RunOptions {
  logicLoader: ILogicLoader;
  renderer: IRenderer;
}

export interface AppSwitcherContextDependencies {
  /* eslint-disable @typescript-eslint/naming-convention */
  SwitcherStatus: ISwitcherStatus;
  ActionType: IActionType;
  ActionTargetType: IActionTargetType;
  /* eslint-enable @typescript-eslint/naming-convention */
  router: IRouter;
}
