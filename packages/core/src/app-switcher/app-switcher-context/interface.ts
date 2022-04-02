import { IActionType, IActionTargetType } from '../../constants/action';
import { ISwitcherStatus } from '../../constants/status';
import { MatchedRoutes } from '../../navigation/matcher/service';
import { IRouter } from '../../navigation/router/service';
import { createServiceSymbol } from '../../utils';
import { IRenderer } from '../renderer/service';

export const IAppSwitcherContextKey = createServiceSymbol('IAppSwitcherContext');

/**
 * 应用加载信息
 * @description 决定 load、mount 和 unmount 哪些应用
 */
export interface IAppSwitcherContext {
  /** 匹配的路由 */
  readonly matchedRoutes: MatchedRoutes;

  /**
   * 开始执行切换应用
   * @description 仅仅执行一次，如果多次调用，返回第一次调用的结果
   */
  run: (options: RunOptions) => Promise<void>;

  /**
   * 取消执行切换应用
   * @description 仅仅执行一次，如果多次调用，返回第一次调用的结果
   */
  cancel: () => Promise<void>;
}

export interface RunOptions {
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
