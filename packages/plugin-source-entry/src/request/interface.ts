import { createServiceSymbol, IApp } from '@versea/core';

export const IRequestKey = createServiceSymbol('IRequest');

export interface IRequest {
  fetch: (url: string, app?: IApp, options?: RequestInit) => Promise<string>;
}
