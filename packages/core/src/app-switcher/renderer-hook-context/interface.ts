import { HookContext } from '@versea/tapable';

import { IAppService } from '../../application/app-service/service';
import { IApp } from '../../application/app/service';
import { MatchedResult } from '../../navigation/matcher/service';
import { MatchedRoute } from '../../navigation/route/service';
import { createServiceSymbol } from '../../utils';
import { IAppSwitcherContext } from '../app-switcher-context/service';
import { IRendererStore } from '../renderer-store/service';

export const IRendererHookContextKey = createServiceSymbol('IRendererHookContext');

/**
 * Renderer 的 Hook 上下文
 * @description 在整个 render 的过程中会一直存在，会传给中 render 的每一个 hook。
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

  /** 渲染信息 Store */
  readonly rendererStore: IRendererStore;

  /** 当前普通路由和目标普通路由不匹配的位置 */
  readonly mismatchIndex: number;

  /** 当前普通路由的渲染操作对象 */
  target: NormalRendererTarget | null;

  setTarget: (index: number) => void;

  resetTarget: () => void;

  /** 引导再渲染应用 */
  bootstrapAndMount: (app: IApp, route: MatchedRoute) => Promise<void>;
}

/** 普通路由的操作对象 */
export interface NormalRendererTarget {
  /**
   * 当前执行的位置 index
   * @description 普通路由的渲染操作是按 index 顺序或倒序依次执行的，index 是当前执行的位置。
   */
  index: number;

  /** 当前执行的路由 */
  currentRoute: MatchedRoute;

  /** 需要执行的目标路由 */
  targetRoute: MatchedRoute;
}

export interface RendererHookContextOptions {
  matchedResult: MatchedResult;
}

export interface RendererHookContextDependencies {
  switcherContext: IAppSwitcherContext;
  rendererStore: IRendererStore;
  appService: IAppService;
}
