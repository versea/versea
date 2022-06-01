import { createServiceSymbol, IApp } from '@versea/core';

export const IScopedCSSKey = createServiceSymbol('IScopedCSS');

export interface IScopedCSS {
  /**
   * 处理 HTMLStyleElement 内的 CSSRules
   * @description 增加样式前缀和拼接
   */
  process: (styleNode: HTMLStyleElement, app: IApp) => void;
}
