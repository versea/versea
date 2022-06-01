/* eslint-disable @typescript-eslint/no-magic-numbers */
import { IApp, provide } from '@versea/core';
import { IContainerRenderer, IContainerRendererKey } from '@versea/plugin-source-entry';
import { inject } from 'inversify';

import { globalEnv } from '../../global-env';
import { IScopedCSS, IScopedCSSKey } from './interface';

export * from './interface';

const ModifiedTag = 'Symbol(style-modified-versea)';

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

const transformRulesToArray = <T>(list: CSSRuleList | T[]): T[] => [].slice.call(list, 0) as T[];

@provide(IScopedCSSKey)
export class ScopedCSS implements IScopedCSS {
  protected _sheet: StyleSheet;

  protected _swapNode: HTMLStyleElement;

  protected _containerRenderer: IContainerRenderer;

  constructor(@inject(IContainerRendererKey) containerRenderer: IContainerRenderer) {
    this._containerRenderer = containerRenderer;

    // 在 document.body 上创建一个空的 style 标签，设置样式表为禁用
    const { rawCreateElement, rawAppendChild } = globalEnv;
    const styleNode = rawCreateElement.call(document, 'style') as HTMLStyleElement;
    rawAppendChild.call(document.body, styleNode);

    this._swapNode = styleNode;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this._sheet = styleNode.sheet!;
    this._sheet.disabled = true;
  }

  public process(styleNode: HTMLStyleElement, app: IApp): void {
    const { rawAppendChild, rawRemoveChild } = globalEnv;

    if (styleNode.textContent !== '') {
      const textNode = document.createTextNode(styleNode.textContent ?? '');

      // 在 _swapNode 中增加样式
      rawAppendChild.call(this._swapNode, textNode);
      // 根据 _swapNode 中的样式表生成新的 css text
      styleNode.textContent = this._getScopedCSS(this._swapNode, app);
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
          styleNode.textContent = this._getScopedCSS(styleNode, app);
          (styleNode as HTMLStyleElement & { [ModifiedTag]: boolean })[ModifiedTag] = true;
        }
      }
    });

    // since observer will be deleted when node be removed
    // we dont need create a cleanup function manually
    // see https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver/disconnect
    mutator.observe(styleNode, { childList: true });
  }

  /** 获取 ScopedCSS 的 text */
  protected _getScopedCSS(styleNode: HTMLStyleElement, app: IApp): string {
    const sheet = styleNode.sheet;
    const rules = transformRulesToArray<CSSRule>(sheet?.cssRules ?? []);
    return this._rewrite(rules, app);
  }

  protected _rewrite(rules: CSSRule[], app: IApp): string {
    let css = '';

    rules.forEach((rule) => {
      switch (rule.type) {
        case RuleType.STYLE:
          css += this._ruleStyle(rule as CSSStyleRule, app);
          break;
        case RuleType.MEDIA:
          css += this._ruleMedia(rule as CSSMediaRule, app);
          break;
        case RuleType.SUPPORTS:
          css += this._ruleSupport(rule as CSSSupportsRule, app);
          break;
        default:
          css += `${rule.cssText}`;
          break;
      }
    });

    return css;
  }

  protected _ruleStyle(rule: CSSStyleRule, app: IApp): string {
    const prefix = this._containerRenderer.getWrapperId(app.name);

    const rootSelectorRE = /((?:[^\w\-.#]|^)(body|html|:root))/gm;
    const rootCombinationRE = /(html[^\w{[]+)/gm;

    const selector = rule.selectorText.trim();

    let { cssText } = rule;
    // handle html { ... }
    // handle body { ... }
    // handle :root { ... }
    if (selector === 'html' || selector === 'body' || selector === ':root') {
      return cssText.replace(rootSelectorRE, prefix);
    }

    // handle html body { ... }
    // handle html > body { ... }
    if (rootCombinationRE.test(rule.selectorText)) {
      const siblingSelectorRE = /(html[^\w{]+)(\+|~)/gm;

      // since html + body is a non-standard rule for html
      // transformer will ignore it
      if (!siblingSelectorRE.test(rule.selectorText)) {
        cssText = cssText.replace(rootCombinationRE, '');
      }
    }

    // handle grouping selector, a,span,p,div { ... }
    cssText = cssText.replace(/^[\s\S]+{/, (selectors) =>
      selectors.replace(/(^|,\n?)([^,]+)/g, (item, p, s) => {
        // handle div,body,span { ... }
        if (rootSelectorRE.test(item)) {
          return item.replace(rootSelectorRE, (m) => {
            // do not discard valid previous character, such as body,html or *:not(:root)
            const whitePrevChars = [',', '('];

            if (m && whitePrevChars.includes(m[0])) {
              return `${m[0]}${prefix}`;
            }

            // replace root selector with prefix
            return prefix;
          });
        }

        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        return `${p}${prefix} ${s.replace(/^ */, '')}`;
      }),
    );

    return cssText;
  }

  protected _ruleMedia(rule: CSSMediaRule, app: IApp): string {
    const css = this._rewrite(transformRulesToArray(rule.cssRules), app);
    return `@supports ${rule.conditionText} {${css}}`;
  }

  protected _ruleSupport(rule: CSSSupportsRule, app: IApp): string {
    const css = this._rewrite(transformRulesToArray(rule.cssRules), app);
    return `@supports ${rule.conditionText} {${css}}`;
  }
}
