import { AsyncSeriesHook } from '@versea/tapable';

import { ILogicLoaderHookContext } from '../app-switcher/logic-loader-hook-context/service';
import { ILogicRendererHookContext } from '../app-switcher/logic-renderer-hook-context/service';
import { createServiceSymbol } from '../utils';

export const IHooksKey = createServiceSymbol('IHooks');

export interface IHooks {
  /**
   * 执行逻辑加载应用的勾子
   * @description 作用于整个加载应用的生命周期，可以通过优先级决定 Load 之前与之后
   */
  logicLoad: AsyncSeriesHook<ILogicLoaderHookContext>;

  /** 执行加载单条应用的生命周期 */
  logicLoadApps: AsyncSeriesHook<ILogicLoaderHookContext>;

  /**
   * 执行逻辑销毁应用的勾子
   * @description 作用于整个销毁应用的生命周期，可以通过优先级决定 Unmount 之前与之后
   */
  logicUnmount: AsyncSeriesHook<ILogicRendererHookContext>;

  /**
   * 执行逻辑销毁普通路由应用的勾子
   * @description 作用于整个销毁应用的生命周期，可以通过优先级决定 Unmount 之前与之后
   */
  logicUnmountNormal: AsyncSeriesHook<ILogicRendererHookContext>;

  /** 执行销毁单条碎片应用的勾子 */
  logicUnmountFragmentApps: AsyncSeriesHook<ILogicRendererHookContext>;

  /** 执行销毁单条主应用的勾子 */
  logicUnmountMainApp: AsyncSeriesHook<ILogicRendererHookContext>;

  /** 执行销毁单条根部碎片应用的勾子 */
  logicUnmountRoot: AsyncSeriesHook<ILogicRendererHookContext>;

  /**
   * 执行逻辑渲染应用的勾子
   * @description 作用于整个渲染应用的生命周期，可以通过优先级决定 Mount 之前与之后
   */
  logicMount: AsyncSeriesHook<ILogicRendererHookContext>;
}
