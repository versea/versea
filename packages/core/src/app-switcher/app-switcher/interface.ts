import { MatchedResult } from '../../navigation/matcher/interface';
import { createServiceSymbol } from '../../utils';
import { IAppSwitcherContext } from '../app-switcher-context/interface';

export const IAppSwitcher = createServiceSymbol('IAppSwitcher');

export interface IAppSwitcher {
  /**
   * 最新的 context
   * @description 每次执行 switch，都会使用传入的 SwitcherOptions 生成一个新的 context。
   */
  context: IAppSwitcherContext | null;

  /**
   * 当前的 context
   * @description 不同于最新的 context，它是真实的正在运行的路由和应用状态。
   */
  currentContext: IAppSwitcherContext | null;

  /** 切换应用 */
  switch: (options: SwitcherOptions) => Promise<void>;
}

export interface SwitcherOptions {
  /** 路由变更的 event 对象 */
  navigationEvent?: Event;

  /** 路由匹配的结果 */
  matchedResult: MatchedResult;
}
