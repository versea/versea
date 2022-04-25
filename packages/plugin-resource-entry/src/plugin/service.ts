import { App, IHooks, IHooksKey, provide } from '@versea/core';
import { VerseaError } from '@versea/shared';
import { inject } from 'inversify';

import { IAppLoaderWriter, IAppLoaderWriterKey } from '../app-loader-writer/interface';
import { VERSEA_PLUGIN_RESOURCE_ENTRY_TAP } from '../constants';
import { IPluginResourceEntry, IPluginResourceEntryKey } from './interface';

export * from './interface';

@provide(IPluginResourceEntryKey)
export class PluginResourceEntry implements IPluginResourceEntry {
  protected _hooks: IHooks;

  protected _appLoaderWriter: IAppLoaderWriter;

  constructor(@inject(IHooksKey) hooks: IHooks, @inject(IAppLoaderWriterKey) appLoaderWriter: IAppLoaderWriter) {
    this._hooks = hooks;
    this._appLoaderWriter = appLoaderWriter;
  }

  public apply(): void {
    this._hooks.beforeRegisterApp.tap(VERSEA_PLUGIN_RESOURCE_ENTRY_TAP, ({ config }) => {
      if (config.loadApp) {
        return;
      }

      if (!config.entry) {
        throw new VerseaError('Miss required prop "entry"');
      }

      this._appLoaderWriter.rewrite(config);
      return;
    });
  }
}

// entry 信息在 App 实例上保存一份
App.defineProp('entry');

declare module '@versea/core' {
  export interface AppConfig {
    /**
     * 应用入口路径
     * @example http://localhost:3000/sub-app/
     */
    entry?: string;

    /**
     * 容器名称
     * @example #app
     */
    container?: string;

    /**
     * 文档内容
     * @example <div><h1>title</h1><div id="sub-app-name"></div></div>
     */
    documentFragment?: string;

    /** 应用样式路径 */
    styles?: string[];

    /** 应用脚本路径 */
    scripts?: string[];
  }

  export interface IApp {
    /**
     * 应用入口路径
     * @example http://localhost:3000/sub-app/
     */
    entry?: string;
  }
}
