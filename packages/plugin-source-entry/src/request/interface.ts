import { createServiceSymbol, IApp } from '@versea/core';

export const IRequestKey = createServiceSymbol('IRequest');

export interface IRequest {
  /** 获取资源内容 */
  fetch: (url: string, app?: IApp, options?: RequestInit) => Promise<string>;
}
