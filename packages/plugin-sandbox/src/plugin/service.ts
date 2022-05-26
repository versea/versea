import { App, IConfigKey, IHooks, IHooksKey, provide, provideValue } from '@versea/core';
import { IPluginSourceEntry, IPluginSourceEntryKey } from '@versea/plugin-source-entry';
import { VerseaError } from '@versea/shared';
import { inject } from 'inversify';

import { VERSEA_PLUGIN_SANDBOX_TAP } from '../constants';
import { IStyleLoader, IStyleLoaderKey } from '../source/style-loader/interface';
import { IPluginSandbox, IPluginSandboxKey } from './interface';

export * from './interface';

// 声明所有应用默认开启沙箱
provideValue({ sandbox: true }, IConfigKey);

App.defineProp('_useSandbox', { optionKey: 'sandbox' });

@provide(IPluginSandboxKey)
export class PluginSandbox implements IPluginSandbox {
  public isApplied = false;

  protected _hooks: IHooks;

  protected _styleLoader: IStyleLoader;

  protected _pluginSourceEntry: IPluginSourceEntry;

  constructor(
    @inject(IHooksKey) hooks: IHooks,
    @inject(IStyleLoaderKey) styleLoader: IStyleLoader,
    @inject(IPluginSourceEntryKey) pluginSourceEntry: IPluginSourceEntry,
  ) {
    this._hooks = hooks;
    this._styleLoader = styleLoader;
    this._pluginSourceEntry = pluginSourceEntry;
  }

  public apply(): void {
    if (!this._pluginSourceEntry.isApplied) {
      throw new VerseaError('Please use plugin @versea/plugin-source-entry first.');
    }
    this._tapLoadSource();

    this.isApplied = true;
  }

  protected _tapLoadSource(): void {
    this._hooks.loadSource.tap(VERSEA_PLUGIN_SANDBOX_TAP, async (context) => {
      await this._styleLoader.load(context);
    });
  }
}
