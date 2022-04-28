import { createServiceSymbol } from '@versea/core';

export const IPluginCustomMatchRouteKey = createServiceSymbol('IPluginCustomMatchRoute');

export interface IPluginCustomMatchRoute {
  /** 启动插件 */
  apply: () => void;
}
