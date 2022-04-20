import { AsyncSeriesHook } from '@versea/tapable';

import { ILoaderHookContext } from '../app-switcher/loader-hook-context/service';
import { IRendererHookContext } from '../app-switcher/renderer-hook-context/service';
import { provide } from '../provider';
import { IHooks, IHooksKey } from './interface';

export * from './interface';

@provide(IHooksKey)
export class Hooks implements IHooks {
  public load = new AsyncSeriesHook<ILoaderHookContext>();

  public loadApps = new AsyncSeriesHook<ILoaderHookContext>();

  public unmount = new AsyncSeriesHook<IRendererHookContext>();

  public unmountApps = new AsyncSeriesHook<IRendererHookContext>();

  public unmountRootFragmentApps = new AsyncSeriesHook<IRendererHookContext>();

  public mount = new AsyncSeriesHook<IRendererHookContext>();

  public mountMainApps = new AsyncSeriesHook<IRendererHookContext>();

  public mountRootFragmentApps = new AsyncSeriesHook<IRendererHookContext>();

  public mountFragmentApps = new AsyncSeriesHook<IRendererHookContext>();
}
