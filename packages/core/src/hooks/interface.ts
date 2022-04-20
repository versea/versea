import { AsyncSeriesHook } from '@versea/tapable';

import { ILoaderHookContext } from '../app-switcher/loader-hook-context/service';
import { IRendererHookContext } from '../app-switcher/renderer-hook-context/service';
import { createServiceSymbol } from '../utils';

export const IHooksKey = createServiceSymbol('IHooks');

export interface IHooks {
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
}
