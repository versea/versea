import { IApp, IConfig, IConfigKey, provide } from '@versea/core';
import { inject } from 'inversify';

import { IFetcher, IFetcherKey } from './interface';

export * from './interface';

@provide(IFetcherKey)
export class Fetcher implements IFetcher {
  protected _config: IConfig;

  constructor(@inject(IConfigKey) config: IConfig) {
    this._config = config;
  }

  public async fetch(url: string, app?: IApp, options?: RequestInit): Promise<string> {
    if (app?.fetch) {
      return app.fetch(url, options);
    }

    if (this._config.fetch) {
      return this._config.fetch(url, options, app);
    }

    const res = await fetch(url, options);
    return res.text();
  }
}
