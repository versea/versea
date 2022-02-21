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
   */
  appsToLoad: IApp[][];

  /**
   * 需要 mount 的应用
   */
  appsToMount: IApp[][];

  /**
   * 在本次 context 销毁之前需要 unmount 的应用
   */
  readonly appsToUnmount: IApp[][];
}
