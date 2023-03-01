import { createServiceSymbol, IApp } from '@versea/core';
import { SourceStyle } from '@versea/plugin-source-entry';
import { HookContext } from '@versea/tapable';

export const IScopedCSS = createServiceSymbol('IScopedCSS');

export interface IScopedCSS {
  /** 增加监听函数 */
  apply: () => void;

  /** 给 HTMLStyleElement 内的 CSSRules 增加样式作用域 */
  process: (styleNode: HTMLStyleElement, style: SourceStyle, app: IApp) => void;

  /** 重写 CSSStyleRule 的选择器 */
  rewriteStyleRuleSelector: (cssText: string, prefix: string, style: SourceStyle, app: IApp) => string;

  /** 重写 CSSRule 的 url */
  rewriteCSSRuleUrl: (cssText: string, style: SourceStyle, app: IApp) => string;
}

export interface RewriteCSSRuleHookContext extends HookContext {
  app: IApp;
  rule: CSSRule;

  /** 样式前缀 */
  prefix: string;

  /** 样式资源描述 */
  style: SourceStyle;

  /** rewriteCSSRule 的结果 */
  result: string;
}

export interface RewriteCSSRuleSelectorHookContext extends HookContext {
  app: IApp;

  /** 选择器之前的符号，例如 "," 或 "\n," */
  p: string;

  /** 选择器 */
  selector: string;

  /** 样式前缀 */
  prefix: string;

  /** 样式资源描述 */
  style: SourceStyle;

  /** rewriteCSSRuleSelector 的结果 */
  result: string;
}
