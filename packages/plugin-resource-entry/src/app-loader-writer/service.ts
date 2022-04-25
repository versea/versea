import { AppConfig, IHooks, IHooksKey, provide } from '@versea/core';
import { inject } from 'inversify';

import { IAppLoaderWriter, IAppLoaderWriterKey } from './interface';

export * from './interface';

@provide(IAppLoaderWriterKey)
export class AppLoaderWriter implements IAppLoaderWriter {
  protected _hooks: IHooks;

  constructor(@inject(IHooksKey) hooks: IHooks) {
    this._hooks = hooks;
  }

  public rewrite(config: AppConfig): void {
    config.entry = '123';
    return;
  }
}
