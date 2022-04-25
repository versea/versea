import { MatchedResult } from '../../navigation/matcher/interface';
import { createServiceSymbol } from '../../utils';
import { IAppSwitcherContext } from '../app-switcher-context/interface';

export const IAppSwitcherKey = createServiceSymbol('IAppSwitcher');

export interface SwitcherOptions {
  navigationEvent?: Event;
  matchedResult: MatchedResult;
}

export interface IAppSwitcher {
  /**
   * 最新的 context
   * @description 每次执行 switch，都会使用传入的 SwitcherOptions 生成一个新的 context。
   */
  context: IAppSwitcherContext | null;

  /**
   * 当前的 context
   * @description 不同于最新的 context，它是真实的正在运行的路由和应用状态。
   * ---
   * 每次切换路由之后应用的加载、销毁、渲染都是异步的，因此整个 switch 操作也是异步的。
   */
  currentContext: IAppSwitcherContext | null;

  /** 使用匹配的路由切换应用 */
  switch: (options: SwitcherOptions) => Promise<void>;
}
