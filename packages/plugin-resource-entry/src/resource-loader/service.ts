import { AppConfig, AppHooks, provide } from '@versea/core';
import { memoizePromise } from '@versea/shared';

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
      void Promise.all(styles.map(async (style) => this._loadStyle(style)));
    }

    if (scripts) {
      for (const script of scripts) {
        await this._loadScript(script);
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    return (window as any)[name] as AppHooks;
  }
}
