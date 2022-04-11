import { MatchedResult } from '../../navigation/matcher/service';
import { createServiceSymbol } from '../../utils';
import { IAppSwitcherContext } from '../app-switcher-context/service';

export const IAppSwitcherKey = createServiceSymbol('IAppSwitcher');

export interface SwitcherOptions {
  navigationEvent?: Event;
  matchedResult: MatchedResult;
}

export interface IAppSwitcher {
  /** 最新的 context */
  context: IAppSwitcherContext | null;

  /** 当前生效或正在运行的 context */
  currentContext: IAppSwitcherContext | null;

  /** 使用匹配的路由切换应用 */
  switch: (options: SwitcherOptions) => Promise<void>;
}
