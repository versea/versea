import { createServiceSymbol, IPlugin } from '@versea/core';

export const IPluginResourceEntryKey = createServiceSymbol('IPluginResourceEntry');

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IPluginResourceEntry extends IPlugin {}
