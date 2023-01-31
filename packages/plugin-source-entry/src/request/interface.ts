import { createServiceSymbol, IApp } from '@versea/core';

export const IRequest = createServiceSymbol('IRequest');

export interface IRequest {
  /* 发请求给 Server 获取文件内容 */
  fetch: (url: string, app?: IApp, options?: RequestInit) => Promise<string>;
}
