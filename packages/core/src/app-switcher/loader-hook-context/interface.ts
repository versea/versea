import { HookContext } from '@versea/tapable';

import { IApp } from '../../application/app/interface';
import { MatchedResult } from '../../navigation/matcher/interface';
import { MatchedRoute } from '../../navigation/route/interface';
import { createServiceSymbol } from '../../utils';
import { IAppSwitcherContext } from '../app-switcher-context/interface';

export const ILoaderHookContextKey = createServiceSymbol('ILoaderHookContext');

/**
 * Loader 的 Hook 上下文
 * @description 在整个 load 的过程中会一直存在，，会传给中 load 的每一个 hook。
 */
export interface ILoaderHookContext extends HookContext {
  readonly switcherContext: IAppSwitcherContext;

  /** 路由匹配的结果 */
  readonly matchedResult: MatchedResult;

  /**
   * 需要加载的应用
   * @description 二维数组表示串行和并行。
   * @example [[A, B], [C, D]] 会优先并行加载[A, B]，再并行加载[C, D]。
   */
  targetApps: IApp[][];

  /** 当前需要加载的应用 */
  currentLoadApps: IApp[];

  /** 根据应用获取匹配的路由 */
  findMatchedRouteByApp: (app: IApp) => MatchedRoute | undefined;
}

export interface LoaderHookContextOptions {
  matchedResult: MatchedResult;
  switcherContext: IAppSwitcherContext;
}
