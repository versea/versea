import { createServiceSymbol, IPlugin } from '@versea/core';

export const IPluginCustomMatchRoute = createServiceSymbol('IPluginCustomMatchRoute');

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IPluginCustomMatchRoute extends IPlugin {}
