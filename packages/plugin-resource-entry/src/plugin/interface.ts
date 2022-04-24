import { createServiceSymbol } from '@versea/core';

export const IPluginResourceEntryKey = createServiceSymbol('IPluginResourceEntry');

export interface IPluginResourceEntry {
  /** 启动插件 */
  apply: () => void;
}
