import { createServiceSymbol, IPlugin } from '@versea/core';

export const IPluginCustomMatchRouteKey = createServiceSymbol('IPluginCustomMatchRoute');

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IPluginCustomMatchRoute extends IPlugin {}
