import { AsyncSeriesHook, BaseHook, SyncHook } from '@versea/tapable';

import { IAppSwitcherContext } from '../app-switcher/app-switcher-context/interface';
import { ILoaderHookContext } from '../app-switcher/loader-hook-context/interface';
import { IRendererHookContext } from '../app-switcher/renderer-hook-context/interface';
import { RegisterAppHookContext } from '../application/app-service/interface';
import { MatchRoutesHookContext, MatchRouteHookContext } from '../navigation/matcher/interface';
import { RerouteHookContext } from '../navigation/router/interface';
import { createServiceSymbol } from '../utils';

export const IHooks = createServiceSymbol('IHooks');

export interface IHooks {
  /** 注册应用之前 */
  beforeRegisterApp: SyncHook<RegisterAppHookContext>;

  /** 注册应用之后 */
  afterRegisterApp: SyncHook<RegisterAppHookContext>;

  /** 执行匹配普通路由 */
  matchTree: SyncHook<MatchRoutesHookContext>;

  /** 执行匹配根部碎片路由 */
  matchFragment: SyncHook<MatchRoutesHookContext>;

  /** 匹配单个路由节点 */
  matchRoute: SyncHook<MatchRouteHookContext>;

  reroute: AsyncSeriesHook<RerouteHookContext>;

  /** 切换应用之前 */
  beforeSwitch: AsyncSeriesHook<IAppSwitcherContext>;

  /** 切换应用之后 */
  afterSwitch: AsyncSeriesHook<IAppSwitcherContext>;

  /** 加载应用 */
  load: AsyncSeriesHook<ILoaderHookContext>;

  /** 加载单组应用 */
  loadApps: AsyncSeriesHook<ILoaderHookContext>;

  /** 销毁应用 */
  unmount: AsyncSeriesHook<IRendererHookContext>;

  /** 销毁主应用和碎片应用 */
  unmountApps: AsyncSeriesHook<IRendererHookContext>;

  /** 销毁根部碎片应用 */
  unmountRootFragmentApps: AsyncSeriesHook<IRendererHookContext>;

  /** 渲染应用 */
  mount: AsyncSeriesHook<IRendererHookContext>;

  /** 渲染主应用 */
  mountMainApps: AsyncSeriesHook<IRendererHookContext>;

  /** 渲染根部碎片应用 */
  mountRootFragmentApps: AsyncSeriesHook<IRendererHookContext>;

  /** 渲染碎片应用 */
  mountFragmentApps: AsyncSeriesHook<IRendererHookContext>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addHook: (key: string, hook: BaseHook<any, any>) => void;
}
