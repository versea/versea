import { createServiceSymbol, IApp } from '@versea/core';

export const IScopedCSSKey = createServiceSymbol('IScopedCSS');

export interface IScopedCSS {
  /** 给 HTMLStyleElement 内的 CSSRules 增加样式作用域 */
  process: (styleNode: HTMLStyleElement, app: IApp) => void;
}
