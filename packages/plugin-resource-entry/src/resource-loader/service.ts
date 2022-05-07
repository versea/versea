import { AppConfig, AppHooks, provide } from '@versea/core';
import { memoizePromise } from '@versea/shared';

import { ScriptResource } from '../plugin/interface';
import { requestIdleCallback } from '../utils';
import { IResourceLoader, IResourceLoaderKey } from './interface';

export * from './interface';

@provide(IResourceLoaderKey)
export class ResourceLoader implements IResourceLoader {
  @memoizePromise(0, false)
  protected async _loadScript(url: string): Promise<Event> {
    return new Promise((resolve, reject) => {
      const head = document.getElementsByTagName('head')[0];
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.onload = resolve;
      script.onerror = reject;
      script.src = url;
      head.appendChild(script);
    });
  }

  @memoizePromise(0, false)
  protected async _loadStyle(url: string): Promise<Event> {
    return new Promise((resolve, reject) => {
      const head = document.getElementsByTagName('head')[0];
      const link = document.createElement('link');
      link.type = 'text/css';
      link.rel = 'stylesheet';
      link.href = url;
      link.onload = resolve;
      link.onerror = reject;
      head.appendChild(link);
    });
  }

  public async load({ scripts, styles, name }: AppConfig): Promise<AppHooks> {
    if (styles?.length) {
      await Promise.all(
        styles.map(async (style) => {
          if (this.isInlineCode(style)) {
            this._appendStyle(this.getInlineCode(style));
            return Promise.resolve();
          } else {
            return this._loadStyle(style);
          }
        }),
      );
    }

    if (scripts) {
      for (const script of scripts) {
        if (typeof script === 'object') {
          if (script.async) {
            requestIdleCallback(() => void this._loadScript((script as ScriptResource).src));
          }
        } else {
          if (this.isInlineCode(script)) {
            this.evalCode(script, this.getInlineCode(script), window, false);
          } else {
            await this._loadScript(script);
          }
        }
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    return (window as any)[name] as AppHooks;
  }

  public isInlineCode(code: string): boolean {
    return code.startsWith('<');
  }

  public getInlineCode(code: string): string {
    const start = code.indexOf('>') + 1;
    const end = code.lastIndexOf('<');
    return code.substring(start, end);
  }

  public evalCode(src: string, code: string, global: unknown, strict: boolean): void {
    const sourceUrl = this.isInlineCode(src) ? '' : `//# sourceURL=${src}\n`;
    const functionBody = strict
      ? `;(function(window, self, globalThis){with(window){;${code}\n${sourceUrl}}}).bind(global)(global, global, global);`
      : `;(function(window, self, globalThis){;${code}\n${sourceUrl}}).bind(global)(global, global, global);`;
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const code2Function = new Function('global', functionBody);
    code2Function(global);
  }

  protected _appendStyle(text: string): void {
    const styleNode = document.createElement('style');
    const textNode = document.createTextNode(text);
    styleNode.appendChild(textNode);
    styleNode.setAttribute('type', 'text/css');
    document.head.appendChild(styleNode);
  }
}
