import { createServiceSymbol, IApp } from '@versea/core';

export const IRequest = createServiceSymbol('IRequest');

export interface IRequest {
  /** 发送请求 */
  fetch: (url: string, app?: IApp, options?: RequestInit) => Promise<string>;
}
