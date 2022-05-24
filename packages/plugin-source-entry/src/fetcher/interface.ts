import { createServiceSymbol, IApp } from '@versea/core';

export const IFetcherKey = createServiceSymbol('IFetcher');

export interface IFetcher {
  fetch: (url: string, app?: IApp, options?: RequestInit) => Promise<string>;
}
