import { AsyncSeriesHook, BaseHook, SyncHook } from '@versea/tapable';

import { IAppSwitcherContext } from '../app-switcher/app-switcher-context/interface';
import { ILoaderHookContext } from '../app-switcher/loader-hook-context/interface';
import { IRendererHookContext } from '../app-switcher/renderer-hook-context/interface';
import { RegisterAppHookContext } from '../application/app-service/interface';
import { MatchRouteHookContext, MatchRoutesHookContext } from '../navigation/matcher/interface';
import { RerouteHookContext } from '../navigation/router/interface';
import { provide } from '../provider';
import { IHooks, IHooksKey } from './interface';

export * from './interface';

@provide(IHooksKey)
// eslint-disable-next-line @typescript-eslint/ban-ts-comment, @typescript-eslint/prefer-ts-expect-error
// @ts-ignore 动态增加的 Hook 会使这里类型报错
export class Hooks implements IHooks {
  public beforeRegisterApp = new SyncHook<RegisterAppHookContext>();

  public afterRegisterApp = new SyncHook<RegisterAppHookContext>();

  public matchTree = new SyncHook<MatchRoutesHookContext>();

  public matchFragment = new SyncHook<MatchRoutesHookContext>();

  public matchRoute = new SyncHook<MatchRouteHookContext>();

  public reroute = new AsyncSeriesHook<RerouteHookContext>();

  public beforeSwitch = new AsyncSeriesHook<IAppSwitcherContext>();

  public afterSwitch = new AsyncSeriesHook<IAppSwitcherContext>();

  public load = new AsyncSeriesHook<ILoaderHookContext>();

  public loadApps = new AsyncSeriesHook<ILoaderHookContext>();

  public unmount = new AsyncSeriesHook<IRendererHookContext>();

  public unmountApps = new AsyncSeriesHook<IRendererHookContext>();

  public unmountRootFragmentApps = new AsyncSeriesHook<IRendererHookContext>();

  public mount = new AsyncSeriesHook<IRendererHookContext>();

  public mountMainApps = new AsyncSeriesHook<IRendererHookContext>();

  public mountRootFragmentApps = new AsyncSeriesHook<IRendererHookContext>();

  public mountFragmentApps = new AsyncSeriesHook<IRendererHookContext>();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public addHook(key: string, hook: BaseHook<any, any>): void {
    // @ts-expect-error 外部可以直接增加 hook
    this[key] = hook;
  }
}
