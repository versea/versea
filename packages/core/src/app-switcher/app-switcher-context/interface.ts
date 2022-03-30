import { IApp } from '../../application/app/service';
import { ISwitcherStatusEnum } from '../../constants/status';
import { MatchedRoute } from '../../navigation/route/interface';
import { createServiceSymbol } from '../../utils';

export const IAppSwitcherContextKey = createServiceSymbol('IAppSwitcherContext');

/**
 * 应用加载信息
 * @description 决定 load、mount 和 unmount 哪些应用
 */
export interface IAppSwitcherContext {
  /** 匹配的路由 */
  readonly routes: MatchedRoute[];

  /**
   * 当前已经 Mounted 的应用
   * @description 二维数组表示并列和嵌套关系
   */
  currentMountedApps: IApp[][];

  /**
   * 需要加载的应用
   * @description 二维数组表示串行和并行，如 [[A], [B, C]] 是先加载 A，再同时加载 B 和 C
   */
  appsToLoad: IApp[][];

  /**
   * 需要 mount 的应用
   * @description 二维数组表示串行和并行，如 [[A], [B, C]] 是先 mount A，再同时 mount B 和 C
   */
  readonly appsToMount: IApp[][];

  /** 在本次 context 销毁之前需要 unmount 的应用 */
  appsToUnmount: IApp[][];

  /**
   * 开始执行切换应用
   * @description 仅仅执行一次，如果多次调用，返回第一次调用的结果
   */
  run: () => Promise<void>;

  /**
   * 取消执行切换应用
   * @description 仅仅执行一次，如果多次调用，返回第一次调用的结果
   */
  cancel: () => Promise<void>;

  /** 同步已经渲染的应用给 context */
  syncMountedApps: (mountedApps: IApp[][]) => void;
}

export interface AppSwitcherContextDependencies {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  SwitcherStatusEnum: ISwitcherStatusEnum;
}
