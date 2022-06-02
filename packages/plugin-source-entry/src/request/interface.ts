import { createServiceSymbol, IApp } from '@versea/core';

export const IRequest = createServiceSymbol('IRequest');

export interface IRequest {
  /** 获取资源内容 */
  fetch: (url: string, app?: IApp, options?: RequestInit) => Promise<string>;
}
