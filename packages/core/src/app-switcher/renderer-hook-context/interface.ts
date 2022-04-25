import { HookContext } from '@versea/tapable';

import { IAppService } from '../../application/app-service/interface';
import { IApp } from '../../application/app/interface';
import { MatchedResult } from '../../navigation/matcher/interface';
import { MatchedRoute } from '../../navigation/route/interface';
import { createServiceSymbol } from '../../utils';
import { IAppSwitcherContext } from '../app-switcher-context/interface';
import { IRouteState } from '../route-state/interface';

export const IRendererHookContextKey = createServiceSymbol('IRendererHookContext');

/**
 * Renderer 的 Hook 上下文
 * @description 在整个 render 的过程中会一直存在，会传给 render 的每一个 hook。
 */
export interface IRendererHookContext extends HookContext {
  readonly switcherContext: IAppSwitcherContext;

  /** 目标普通路由 */
  targetRoutes: MatchedRoute[];

  /** 目标根部碎片路由 */
  targetRootFragmentRoutes: MatchedRoute[];

  /** 当前的普通路由 */
  readonly currentRoutes: MatchedRoute[];

  /** 当前的根部碎片路由 */
  readonly currentRootFragmentRoutes: MatchedRoute[];

  /** 路由状态 */
  readonly routeState: IRouteState;

  /** 当前普通路由和目标普通路由不匹配的位置 */
  readonly mismatchIndex: number;

  /** 引导再渲染应用 */
  bootstrapAndMount: (app: IApp, route: MatchedRoute) => Promise<void>;
}

export interface RendererHookContextOptions {
  matchedResult: MatchedResult;
}

export interface RendererHookContextDependencies {
  appService: IAppService;
  routeState: IRouteState;
  switcherContext: IAppSwitcherContext;
}
