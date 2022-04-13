import { AsyncSeriesHook } from '@versea/tapable';

import { ILoaderHookContext } from '../app-switcher/loader-hook-context/service';
import { IRendererHookContext } from '../app-switcher/renderer-hook-context/service';
import { createServiceSymbol } from '../utils';

export const IHooksKey = createServiceSymbol('IHooks');

export interface IHooks {
  /**
   * 执行加载应用的勾子
   * @description 作用于整个加载应用的生命周期，可以通过优先级决定 Load 之前与之后
   */
  load: AsyncSeriesHook<ILoaderHookContext>;

  /** 执行加载单条应用的生命周期 */
  loadApps: AsyncSeriesHook<ILoaderHookContext>;

  /**
   * 执行销毁应用的勾子
   * @description 作用于整个销毁应用的生命周期，可以通过优先级决定 unmount 之前与之后
   */
  unmount: AsyncSeriesHook<IRendererHookContext>;

  /**
   * 执行销毁普通路由应用的勾子
   * @description 作用于整个销毁应用的生命周期，可以通过优先级决定 unmountNormal 之前与之后
   */
  unmountNormal: AsyncSeriesHook<IRendererHookContext>;

  /** 执行销毁单条碎片应用数据的勾子 */
  unmountFragmentApps: AsyncSeriesHook<IRendererHookContext>;

  /** 执行销毁单条主应用数据的勾子 */
  unmountMainApp: AsyncSeriesHook<IRendererHookContext>;

  /** 执行销毁根部碎片应用数据的勾子 */
  unmountRootFragmentApps: AsyncSeriesHook<IRendererHookContext>;

  /**
   * 执行渲染应用的勾子
   * @description 作用于整个渲染应用的生命周期，可以通过优先级决定 mount 之前与之后
   */
  mount: AsyncSeriesHook<IRendererHookContext>;

  /** 执行渲染主应用数据勾子 */
  mountMainApp: AsyncSeriesHook<IRendererHookContext>;

  /** 执行渲染根部碎片应用数据的勾子 */
  mountRootFragmentApps: AsyncSeriesHook<IRendererHookContext>;

  /** 执行渲染碎片应用数据的勾子 */
  mountFragmentApps: AsyncSeriesHook<IRendererHookContext>;
}
