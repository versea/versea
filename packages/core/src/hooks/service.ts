import { AsyncSeriesHook } from '@versea/tapable';

import { ILogicLoaderHookContext } from '../app-switcher/logic-loader-hook-context/service';
import { provide } from '../provider';
import { IHooks, IHooksKey } from './interface';

export * from './interface';

@provide(IHooksKey)
export class Hooks implements IHooks {
  public beforeLoadApps = new AsyncSeriesHook<ILogicLoaderHookContext>();

  public loadApps = new AsyncSeriesHook<ILogicLoaderHookContext>();

  public afterLoadApps = new AsyncSeriesHook<ILogicLoaderHookContext>();
}
