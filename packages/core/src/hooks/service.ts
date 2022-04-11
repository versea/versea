import { AsyncSeriesHook } from '@versea/tapable';

import { ILogicLoaderHookContext } from '../app-switcher/logic-loader-hook-context/service';
import { provide } from '../provider';
import { IHooks, IHooksKey } from './interface';

export * from './interface';

@provide(IHooksKey)
export class Hooks implements IHooks {
  public beforeLogicLoad = new AsyncSeriesHook<ILogicLoaderHookContext>();

  public logicLoad = new AsyncSeriesHook<ILogicLoaderHookContext>();

  public afterLogicLoad = new AsyncSeriesHook<ILogicLoaderHookContext>();
}
