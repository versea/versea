import { createServiceSymbol } from '../utils';
export const IStarterKey = createServiceSymbol('IStarter');

export interface IStarter {
  /** 是否已经执行 start */
  isStarted: boolean;

  /**
   * 启动应用
   * @see AppSwitcherContext#run
   * @description 未启动应用只会加载，启动应用之后才会渲染，因此必须调用一次这个方法
   */
  start: () => Promise<void>;
}
