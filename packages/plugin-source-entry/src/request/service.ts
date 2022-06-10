import { IApp, IConfig, provide } from '@versea/core';
import { inject } from 'inversify';

import { IInternalApp } from '../plugin/interface';
import { IRequest } from './interface';

export * from './interface';

@provide(IRequest)
export class Request implements IRequest {
  protected _config: IConfig;

  constructor(@inject(IConfig) config: IConfig) {
    this._config = config;
  }

  public async fetch(url: string, app?: IApp, options?: RequestInit): Promise<string> {
    if ((app as IInternalApp)?._fetch) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return (app as IInternalApp)._fetch!(url, options);
    }

    if (this._config.fetch) {
      return this._config.fetch(url, options, app);
    }

    const res = await fetch(url, options);
    return res.text();
  }
}
