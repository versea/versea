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

  public unmountNormal = new AsyncSeriesHook<IRendererHookContext>();

  public unmountFragmentApps = new AsyncSeriesHook<IRendererHookContext>();

  public unmountMainApp = new AsyncSeriesHook<IRendererHookContext>();

  public unmountRootFragmentApps = new AsyncSeriesHook<IRendererHookContext>();

  public mount = new AsyncSeriesHook<IRendererHookContext>();

  public mountMainApp = new AsyncSeriesHook<IRendererHookContext>();
}
