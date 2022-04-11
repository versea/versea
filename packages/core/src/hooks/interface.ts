import { AsyncSeriesHook } from '@versea/tapable';

import { ILogicLoaderHookContext } from '../app-switcher/logic-loader-hook-context/service';
import { createServiceSymbol } from '../utils';

export const IHooksKey = createServiceSymbol('IHooks');

export interface IHooks {
  /** 在执行逻辑加载应用之前的勾子 */
  beforeLogicLoad: AsyncSeriesHook<ILogicLoaderHookContext>;

  /** 执行逻辑加载应用的勾子 */
  logicLoad: AsyncSeriesHook<ILogicLoaderHookContext>;

  /** 在执行逻辑加载应用之后的勾子 */
  afterLogicLoad: AsyncSeriesHook<ILogicLoaderHookContext>;
}
