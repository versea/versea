import { AsyncSeriesHook } from '@versea/tapable';

import { ILogicLoaderHookContext } from '../app-switcher/logic-loader-hook-context/service';
import { ILogicRendererHookContext } from '../app-switcher/logic-renderer-hook-context/service';
import { provide } from '../provider';
import { IHooks, IHooksKey } from './interface';

export * from './interface';

@provide(IHooksKey)
export class Hooks implements IHooks {
  public logicLoad = new AsyncSeriesHook<ILogicLoaderHookContext>();

  public logicLoadApps = new AsyncSeriesHook<ILogicLoaderHookContext>();

  public logicUnmount = new AsyncSeriesHook<ILogicRendererHookContext>();

  public logicUnmountNormal = new AsyncSeriesHook<ILogicRendererHookContext>();

  public logicUnmountFragmentApps = new AsyncSeriesHook<ILogicRendererHookContext>();

  public logicUnmountMainApp = new AsyncSeriesHook<ILogicRendererHookContext>();

  public logicUnmountRoot = new AsyncSeriesHook<ILogicRendererHookContext>();

  public logicMount = new AsyncSeriesHook<ILogicRendererHookContext>();
}
