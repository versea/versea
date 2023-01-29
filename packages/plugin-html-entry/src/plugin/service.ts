import { IHooks, provide } from '@versea/core';
import { inject } from 'inversify';

import { IPluginHtmlEntry } from './interface';

export * from './interface';

@provide(IPluginHtmlEntry)
export class PluginHtmlEntry implements IPluginHtmlEntry {
  protected _hooks: IHooks;

  constructor(@inject(IHooks) hooks: IHooks) {
    this._hooks = hooks;
  }

  public apply(): void {
    console.log(1);
  }
}
