import { createServiceSymbol, IApp } from '@versea/core';

export const IHtmlLoader = createServiceSymbol('IHtmlLoader');

export interface IHtmlLoader {
  /** 加载 HTML 内容 */
  load: (app: IApp) => void;

  /** 解析 HTML 内容中的资源 */
  extractSourceDom: (app: IApp) => void;
}
