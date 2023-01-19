/* eslint-disable @typescript-eslint/no-magic-numbers */
import { IApp, IHooks, provide } from '@versea/core';
import { completionPath, IContainerRenderer, IInternalApp, SourceStyle } from '@versea/plugin-source-entry';
import { SyncHook } from '@versea/tapable';
import { inject } from 'inversify';

import { PLUGIN_SANDBOX_TAP } from '../../constants';
import { globalEnv } from '../../global-env';
import { IScopedCSS, RewriteCSSRuleHookContext } from './interface';

export * from './interface';

const ModifiedTag = 'Symbol(style-modified-versea)';

const transformRulesToArray = <T>(list: CSSRuleList | T[]): T[] => [].slice.call(list, 0) as T[];

// https://developer.mozilla.org/en-US/docs/Web/API/CSSRule
enum RuleType {
  // 需要重设选择器的 CSSRule 类型
  STYLE = 1,
  MEDIA = 4,
  SUPPORTS = 12,

  // 不需要处理选择器的 CSSRule 类型
  IMPORT = 3,
  FONT_FACE = 5,
  PAGE = 6,
  KEYFRAMES = 7,
  KEYFRAME = 8,
}

@provide(IScopedCSS)
export class ScopedCSS implements IScopedCSS {
  protected _sheet: StyleSheet;

  protected _swapNode: HTMLStyleElement;

  protected _hooks: IHooks;

  protected _containerRenderer: IContainerRenderer;

  constructor(@inject(IHooks) hooks: IHooks, @inject(IContainerRenderer) containerRenderer: IContainerRenderer) {
    this._hooks = hooks;
    this._containerRenderer = containerRenderer;
    this._hooks.addHook('rewriteCSSRule', new SyncHook());

    // 在 document.body 上创建一个空的 style 标签，设置样式表为禁用
    const { rawCreateElement, rawAppendChild } = globalEnv;
    const styleNode = rawCreateElement.call(document, 'style') as HTMLStyleElement;
    rawAppendChild.call(document.body, styleNode);
    this._swapNode = styleNode;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this._sheet = styleNode.sheet!;
    this._sheet.disabled = true;
  }

  public apply(): void {
    this._hooks.rewriteCSSRule.tap(PLUGIN_SANDBOX_TAP, (context) => {
      context.result = context.rule.cssText;
      if (context.rule.type === RuleType.STYLE) {
        context.result = this._rewriteStyleRuleSelector(context.result, context.prefix);
      }
      context.result = this._rewriteCSSRuleUrl(context.result, context.style, context.app);
    });
  }

  public process(styleNode: HTMLStyleElement, style: SourceStyle, app: IApp): void {
    const { rawAppendChild, rawRemoveChild } = globalEnv;

    if (styleNode.textContent !== '') {
      const textNode = document.createTextNode(styleNode.textContent ?? '');

      // 在 _swapNode 中增加样式
      rawAppendChild.call(this._swapNode, textNode);
      // 根据 _swapNode 中的样式表生成新的 css text
      styleNode.textContent = this._getScopedCSSText(this._swapNode, style, app);
      // 删除 _swapNode 中的样式
      rawRemoveChild.call(this._swapNode, textNode);

      return;
    }

    const mutator = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (ModifiedTag in styleNode) {
          return;
        }

        if (mutation.type === 'childList') {
          styleNode.textContent = this._getScopedCSSText(styleNode, style, app);
          (styleNode as HTMLStyleElement & { [ModifiedTag]: boolean })[ModifiedTag] = true;
        }
      }
    });

    // since observer will be deleted when node be removed
    // we don't need create a cleanup function manually
    // see https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver/disconnect
    mutator.observe(styleNode, { childList: true });
  }

  /** 获取 ScopedCSS 的 text */
  protected _getScopedCSSText(styleNode: HTMLStyleElement, style: SourceStyle, app: IApp): string {
    const sheet = styleNode.sheet;
    const rules = transformRulesToArray<CSSRule>(sheet?.cssRules ?? []);
    return this._rewrite(rules, this._getPrefix(app), style, app);
  }

  /** 获取 ScopedCSS 的前缀 */
  protected _getPrefix(app: IApp): string {
    const selectorPrefix = (app as IInternalApp)._selectorPrefix;
    if (selectorPrefix) {
      return selectorPrefix;
    }

    return `#${this._containerRenderer.getWrapperId(app.name)}`;
  }

  protected _rewrite(rules: CSSRule[], prefix: string, style: SourceStyle, app: IApp): string {
    let css = '';

    rules.forEach((rule) => {
      switch (rule.type) {
        case RuleType.MEDIA:
          css += this._ruleMedia(rule as CSSMediaRule, prefix, style, app);
          break;
        case RuleType.SUPPORTS:
          css += this._ruleSupport(rule as CSSSupportsRule, prefix, style, app);
          break;
        default:
          css += this._rewriteRule(rule, prefix, style, app);
          break;
      }
    });

    return css;
  }

  protected _ruleMedia(rule: CSSMediaRule, prefix: string, style: SourceStyle, app: IApp): string {
    const css = this._rewrite(transformRulesToArray(rule.cssRules), prefix, style, app);
    return `@media ${rule.conditionText || rule.media.mediaText} {${css}}`;
  }

  protected _ruleSupport(rule: CSSSupportsRule, prefix: string, style: SourceStyle, app: IApp): string {
    const css = this._rewrite(transformRulesToArray(rule.cssRules), prefix, style, app);
    return `@supports ${rule.conditionText || rule.cssText.split('{')[0]} {${css}}`;
  }

  protected _rewriteRule(rule: CSSRule, prefix: string, style: SourceStyle, app: IApp): string {
    const context = { app, rule, prefix, style } as RewriteCSSRuleHookContext;
    this._hooks.rewriteCSSRule.call(context);
    return context.result;
  }

  /** 重写 CSSStyleRule 的选择器 */
  protected _rewriteStyleRuleSelector(cssText: string, prefix: string): string {
    const rootSelectorRE = /((?:[^\w\-.#]|^)(body|html|:root))/gm;
    const rootCombinationRE = /(html[^\w{[\-.#]+)/gm;

    function getPrefix(_p: string, originSelector: string): string {
      if (originSelector === 'body') {
        return `${_p} versea-app-body`;
      }
      return _p;
    }

    return cssText.replace(/^[\s\S]+{/, (selectors) =>
      // 选择器按逗号分隔开
      selectors.replace(/(^|,\n?)([^,]+)/g, (_, p: string, s: string) => {
        // 去掉 html body, html > body 或 html #app 这类选择器的前面部分
        if (rootCombinationRE.test(s)) {
          const siblingSelectorRE = /(html[^\w{]+)(\+|~)/gm;
          // 忽略 html + body 或 html ~ body
          if (siblingSelectorRE.test(s)) {
            return '';
          }

          s = s.replace(rootCombinationRE, '');
        }

        if (rootSelectorRE.test(s)) {
          s = s.replace(rootSelectorRE, (m, i, t: string) => {
            // 保留特殊字符，例如 body,html 或 *:not(:root) 中的 "," 和 "("
            const whitePrevChars = [',', '('];
            if (m && whitePrevChars.includes(m[0])) {
              return `${m[0]}${getPrefix(prefix, t)}`;
            }
            return getPrefix(prefix, t);
          });
        }

        const startedWithPrefixRE = new RegExp(`^[\\s\\n]*${prefix}`, 'g');
        if (startedWithPrefixRE.test(s)) {
          return `${p}${s.replace(/^ */, '')}`;
        }
        return `${p}${prefix} ${s.replace(/^ */, '')}`;
      }),
    );
  }

  /** 重写 CSSRule 的 url */
  protected _rewriteCSSRuleUrl(cssText: string, style: SourceStyle, app: IApp): string {
    if (!app.assetsPublicPath) {
      return cssText;
    }

    return cssText.replace(/(?:url\(["']?((?:[^)"'}]+))["']?\))/gm, (declaration, url: string) => {
      if (/^((data|blob):|#)/.test(url) || /^(https?:)?\/\//.test(url)) {
        return declaration;
      }

      return `url("${completionPath(url, style.src ?? app.assetsPublicPath)}")`;
    });
  }
}
