import { App, IConfig, IHooks, provide, provideValue } from '@versea/core';
import { IPluginSourceEntry } from '@versea/plugin-source-entry';
import { VerseaError } from '@versea/shared';
import { inject } from 'inversify';

import { VERSEA_PLUGIN_SANDBOX_TAP } from '../constants';
import { IStyleLoader } from '../source/style-loader/interface';
import { IPluginSandbox } from './interface';

export * from './interface';

// 声明所有应用默认开启沙箱和样式作用域
provideValue({ sandbox: true, scopedCSS: true }, IConfig);

App.defineProp('_useSandbox', { optionKey: 'sandbox' });
App.defineProp('_scopedCSS', { optionKey: 'scopedCSS' });
App.defineProp('_selectorPrefix', { optionKey: 'selectorPrefix' });
App.defineProp('_inlineScript', { optionKey: 'inlineScript' });

@provide(IPluginSandbox)
export class PluginSandbox implements IPluginSandbox {
  public isApplied = false;

  protected _hooks: IHooks;

  protected _styleLoader: IStyleLoader;

  protected _pluginSourceEntry: IPluginSourceEntry;

  constructor(
    @inject(IHooks) hooks: IHooks,
    @inject(IStyleLoader) styleLoader: IStyleLoader,
    @inject(IPluginSourceEntry) pluginSourceEntry: IPluginSourceEntry,
  ) {
    this._hooks = hooks;
    this._styleLoader = styleLoader;
    this._pluginSourceEntry = pluginSourceEntry;
  }

  public apply(): void {
    if (!this._pluginSourceEntry.isApplied) {
      throw new VerseaError('Please use plugin "@versea/plugin-source-entry" before "@versea/plugin-sandbox".');
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
