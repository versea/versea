import { createServiceSymbol, IPlugin } from '@versea/core';

export const IPluginHtmlEntry = createServiceSymbol('IPluginHtmlEntry');

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IPluginHtmlEntry extends IPlugin {}
