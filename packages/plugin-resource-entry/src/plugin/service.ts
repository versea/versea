import { AppConfig, IHooks, IHooksKey, provide } from '@versea/core';
import { inject } from 'inversify';

import { VERSEA_PLUGIN_RESOURCE_ENTRY_TAP } from '../constants';
import { IPluginResourceEntry, IPluginResourceEntryKey } from './interface';

export * from './interface';

@provide(IPluginResourceEntryKey)
export class PluginResourceEntry implements IPluginResourceEntry {
  protected _hooks: IHooks;

  constructor(@inject(IHooksKey) hooks: IHooks) {
    this._hooks = hooks;
  }

  public apply(): void {
    this._hooks.beforeRegisterApp.tap(VERSEA_PLUGIN_RESOURCE_ENTRY_TAP, (context) => {
      this._rewriteLoadAppOption(context.config);
    });
  }

  protected _rewriteLoadAppOption(config: AppConfig): void {
    if (config.loadApp) {
      return;
    }

    return;
  }
}

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
}
