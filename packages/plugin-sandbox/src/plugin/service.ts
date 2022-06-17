import { App, AppLifeCycles, IApp, IConfig, IHooks, provide, provideValue } from '@versea/core';
import {
  IInternalApp,
  IPluginSourceEntry,
  PLUGIN_SOURCE_ENTRY_RENDER_CONTAINER_TAP,
  PLUGIN_SOURCE_ENTRY_EXEC_LIFECYCLE_TAP,
  PLUGIN_SOURCE_ENTRY_REMOVE_CONTAINER_TAP,
  PLUGIN_SOURCE_ENTRY_TAP,
} from '@versea/plugin-source-entry';
import { VerseaError } from '@versea/shared';
import { inject, interfaces } from 'inversify';

import { PLUGIN_SANDBOX_TAP } from '../constants';
import { ICurrentApp } from '../current-app/interface';
import { IElementPatch } from '../element-patch/interface';
import { globalEnv } from '../global-env';
import { IDocumentEffect } from '../sandbox/document-effect/interface';
import { ISandboxEffect } from '../sandbox/sandbox-effect/interface';
import { ISandbox } from '../sandbox/sandbox/interface';
import { IWindowEffect } from '../sandbox/window-effect/interface';
import { IScriptLoader } from '../source/script-loader/interface';
import { IStyleLoader } from '../source/style-loader/interface';
import { IPluginSandbox } from './interface';

export * from './interface';

// 声明所有应用默认开启沙箱和样式作用域
provideValue({ sandbox: true, scopedCSS: true }, IConfig);

App.defineProp('_useSandbox', { optionKey: 'sandbox' });
App.defineProp('_scopedCSS', { optionKey: 'scopedCSS' });
App.defineProp('_selectorPrefix', { optionKey: 'selectorPrefix' });
App.defineProp('_inlineScript', { optionKey: 'inlineScript' });
App.defineProp('_isPersistentSourceCode', { optionKey: 'isPersistentSourceCode' });

@provide(IPluginSandbox)
export class PluginSandbox implements IPluginSandbox {
  public isApplied = false;

  protected _config: IConfig;

  protected _hooks: IHooks;

  protected _styleLoader: IStyleLoader;

  protected _scriptLoader: IScriptLoader;

  protected _currentApp: ICurrentApp;

  protected _documentEffect: IDocumentEffect;

  protected _WindowEffect: interfaces.Newable<IWindowEffect>;

  protected _SandboxEffect: interfaces.Newable<ISandboxEffect>;

  protected _Sandbox: interfaces.Newable<ISandbox>;

  protected _elementPatch: IElementPatch;

  protected _pluginSourceEntry: IPluginSourceEntry;

  constructor(
    @inject(IConfig) config: IConfig,
    @inject(IHooks) hooks: IHooks,
    @inject(IStyleLoader) styleLoader: IStyleLoader,
    @inject(IScriptLoader) scriptLoader: IScriptLoader,
    @inject(ICurrentApp) currentApp: ICurrentApp,
    @inject(IDocumentEffect) documentEffect: IDocumentEffect,
    /* eslint-disable @typescript-eslint/naming-convention */
    @inject(IWindowEffect) WindowEffect: interfaces.Newable<IWindowEffect>,
    @inject(ISandboxEffect) SandboxEffect: interfaces.Newable<ISandboxEffect>,
    @inject(ISandbox) Sandbox: interfaces.Newable<ISandbox>,
    /* eslint-enable @typescript-eslint/naming-convention */
    @inject(IElementPatch) elementPatch: IElementPatch,
    @inject(IPluginSourceEntry) pluginSourceEntry: IPluginSourceEntry,
  ) {
    this._config = config;
    this._hooks = hooks;
    this._styleLoader = styleLoader;
    this._scriptLoader = scriptLoader;
    this._currentApp = currentApp;
    this._documentEffect = documentEffect;
    this._WindowEffect = WindowEffect;
    this._SandboxEffect = SandboxEffect;
    this._Sandbox = Sandbox;
    this._elementPatch = elementPatch;
    this._pluginSourceEntry = pluginSourceEntry;
  }

  public apply(): void {
    if (!this._pluginSourceEntry.isApplied) {
      throw new VerseaError('Please use plugin "@versea/plugin-source-entry" before "@versea/plugin-sandbox".');
    }
    this._onLoadSource();
    this._onCreateSandbox();
    this._onStartSandbox();
    this._onMountEffect();
    this._onExecSource();
    this._onStopSandbox();

    this._styleLoader.apply();
    this._scriptLoader.apply();
    this.isApplied = true;
  }

  protected _onLoadSource(): void {
    this._hooks.loadSource.tap(PLUGIN_SANDBOX_TAP, async (context) => {
      await this._styleLoader.load(context);
      await this._scriptLoader.load(context);
    });
  }

  protected _onCreateSandbox(): void {
    this._hooks.loadApp.tap(
      PLUGIN_SANDBOX_TAP,
      async ({ app }) => {
        const useSandbox = (app as IInternalApp)._useSandbox ?? this._config.sandbox;
        if (useSandbox) {
          app.sandbox = new this._Sandbox(
            // @ts-expect-error 需要传入参数，但 inversify 这里的参数类型是 never
            { app },
            {
              currentApp: this._currentApp,
              documentEffect: this._documentEffect,
              WindowEffect: this._WindowEffect,
              SandboxEffect: this._SandboxEffect,
              elementPatch: this._elementPatch,
            },
          );
        }
        return Promise.resolve();
      },
      {
        after: PLUGIN_SOURCE_ENTRY_TAP,
      },
    );
  }

  protected _onStartSandbox(): void {
    this._hooks.mountApp.tap(
      PLUGIN_SANDBOX_TAP,
      async ({ app }) => {
        app.sandbox?.start();
        return Promise.resolve();
      },
      {
        after: PLUGIN_SOURCE_ENTRY_RENDER_CONTAINER_TAP,
      },
    );
  }

  protected _onMountEffect(): void {
    this._hooks.mountApp.tap(
      PLUGIN_SOURCE_ENTRY_TAP,
      async ({ app }) => {
        if ((app as IInternalApp)._isSourceExecuted && app.sandbox) {
          if ((app as IApp & { _hasBeenMounted: boolean })._hasBeenMounted) {
            app.sandbox.rebuildSnapshot();
          } else {
            app.sandbox.recordSnapshot();
            (app as IApp & { _hasBeenMounted: boolean })._hasBeenMounted = true;
          }
        }
        return Promise.resolve();
      },
      {
        before: PLUGIN_SOURCE_ENTRY_EXEC_LIFECYCLE_TAP,
      },
    );
  }

  protected _onExecSource(): void {
    this._hooks.execSource.tap(
      PLUGIN_SOURCE_ENTRY_TAP,
      async (context) => {
        const { app } = context;
        const styleLoader = this._styleLoader;
        const scriptLoader = this._scriptLoader;

        await Promise.all([styleLoader.waitLoaded(app), scriptLoader.waitLoaded(app)]);
        await scriptLoader.exec(app);
        styleLoader.dispose(app);
        scriptLoader.dispose(app);
        context.result = this._getAppLifeCycles(app);
      },
      {
        replace: true,
      },
    );
  }

  protected _onStopSandbox(): void {
    this._hooks.unmountApp.tap(
      PLUGIN_SANDBOX_TAP,
      async ({ app }) => {
        app.sandbox?.stop();
        return Promise.resolve();
      },
      {
        before: PLUGIN_SOURCE_ENTRY_REMOVE_CONTAINER_TAP,
      },
    );
  }

  protected _getAppLifeCycles(app: IApp): AppLifeCycles {
    const global = app.sandbox?.proxyWindow ?? globalEnv.rawWindow;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (global as Record<string, any> & Window)[app.name] as AppLifeCycles;
  }
}
