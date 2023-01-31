import { HookContext } from '@versea/tapable';

import { IApp } from '../../application/app/interface';
import { MatchedResult } from '../../navigation/matcher/interface';
import { createServiceSymbol } from '../../utils';
import { IAppSwitcherContext } from '../app-switcher-context/interface';

export const ILoaderHookContext = createServiceSymbol('ILoaderHookContext');

/** Loader 的 Hook 上下文 */
export interface ILoaderHookContext extends HookContext {
  readonly switcherContext: IAppSwitcherContext;

  /** 路由匹配的结果 */
  readonly matchedResult: MatchedResult;

  /** 需要加载的应用 */
  apps: IApp[];
}

export interface LoaderHookContextOptions {
  switcherContext: IAppSwitcherContext;

  /** 路由匹配的结果 */
  matchedResult: MatchedResult;
}
