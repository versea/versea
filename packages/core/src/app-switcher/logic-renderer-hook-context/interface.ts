import { HookContext } from '@versea/tapable';

import { MatchedResult } from '../../navigation/matcher/service';
import { createServiceSymbol } from '../../utils';
import { IAppSwitcherContext } from '../app-switcher-context/service';

export const ILogicRendererHookContextKey = createServiceSymbol('ILogicRendererHookContext');

export interface ILogicRendererHookContext extends HookContext {
  switcherContext: IAppSwitcherContext;

  /** 路由匹配的结果 */
  matchedResult: MatchedResult;
}

export interface LogicRendererHookContextOptions {
  matchedResult: MatchedResult;
  switcherContext: IAppSwitcherContext;
}
