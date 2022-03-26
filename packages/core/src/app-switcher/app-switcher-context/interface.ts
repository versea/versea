import { IApp } from '../../application/app/service';
import { createServiceSymbol } from '../../utils';

export const IAppSwitcherContextKey = createServiceSymbol('IAppSwitcherContext');

/**
 * 应用加载信息
 * @description 决定 load、mount 和 unmount 哪些应用
 */
export interface IAppSwitcherContext {
  /**
   * 需要加载的应用
   * @description 二维数组表示串行和并行，如 [[A], [B, C]] 是先加载 A，再同时加载 B 和 C
   */
  appsToLoad: IApp[][];

  /**
   * 需要 mount 的应用
   * @description 二维数组表示串行和并行，如 [[A], [B, C]] 是先 mount A，再同时 mount B 和 C
   */
  appsToMount: IApp[][];

  /**
   * 在本次 context 销毁之前需要 unmount 的应用
   */
  readonly appsToUnmount: IApp[][];

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
}
