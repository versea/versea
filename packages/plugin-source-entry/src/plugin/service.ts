import { App, AppLifeCycleFunction, AppLifeCycles, AppProps, IConfig, IHooks, provide } from '@versea/core';
import { logWarn, VerseaError } from '@versea/shared';
import { AsyncSeriesHook } from '@versea/tapable';
import { inject } from 'inversify';

import {
  PLUGIN_SOURCE_ENTRY_TAP,
  PLUGIN_SOURCE_ENTRY_NORMALIZE_SOURCE_TAP,
  PLUGIN_SOURCE_ENTRY_UPDATE_LIFECYCLE_TAP,
  PLUGIN_SOURCE_ENTRY_RENDER_CONTAINER_TAP,
  PLUGIN_SOURCE_ENTRY_EXEC_SOURCE_TAP,
  PLUGIN_SOURCE_ENTRY_EXEC_LIFECYCLE_TAP,
  PLUGIN_SOURCE_ENTRY_REMOVE_CONTAINER_TAP,
} from '../constants';
import { IContainerRenderer } from '../container-renderer/interface';
import { ISourceController } from '../source-controller/interface';
import { addProtocol, getEffectivePath } from '../utils';
import {
  IInternalApp,
  LoadAppHookContext,
  MountAppHookContext,
  UnmountAppHookContext,
  IPluginSourceEntry,
} from './interface';

export * from './interface';

function formatPath(path?: string): string | undefined {
  return path ? getEffectivePath(addProtocol(path)) : path;
}

App.defineProp('styles');
App.defineProp('scripts');
App.defineProp('entry', {
  validator: (value) => value === undefined || typeof value === 'string',
  format: (value) => formatPath(value as string),
});
App.defineProp('assetsPublicPath', {
  validator: (value) => value === undefined || typeof value === 'string',
  format: (value, options) => {
    const assetsPublicPath = formatPath(value as string);
    return assetsPublicPath ?? formatPath(options.entry as string);
  },
});
App.defineProp('_fetch', { optionKey: 'fetch' });
App.defineProp('_parentContainer', { optionKey: 'container' });
App.defineProp('_documentFragment', { optionKey: 'documentFragment' });
App.defineProp('_disableRenderContent', { optionKey: 'disableRenderContent' });
App.defineProp('_libraryName', { optionKey: 'libraryName' });

@provide(IPluginSourceEntry)
export class PluginSourceEntry implements IPluginSourceEntry {
  public isApplied = false;

  protected _config: IConfig;

  protected _hooks: IHooks;

  protected _containerRenderer: IContainerRenderer;

  protected _sourceController: ISourceController;

  constructor(
    @inject(IConfig) config: IConfig,
    @inject(IHooks) hooks: IHooks,
    @inject(IContainerRenderer) containerRenderer: IContainerRenderer,
    @inject(ISourceController) sourceController: ISourceController,
  ) {
    this._config = config;
    this._hooks = hooks;
    this._containerRenderer = containerRenderer;
    this._sourceController = sourceController;
    this._hooks.addHook('loadApp', new AsyncSeriesHook());
    this._hooks.addHook('mountApp', new AsyncSeriesHook());
    this._hooks.addHook('unmountApp', new AsyncSeriesHook());
  }

  public apply(): void {
    this._hooks.beforeRegisterApp.tap(PLUGIN_SOURCE_ENTRY_TAP, ({ config }) => {
      if (config.loadApp) {
        logWarn('Can not set app loadApp function, because it is defined.', config.name);
        return;
      }

      config.loadApp = async (props: AppProps): Promise<AppLifeCycles> => {
        const context = { app: props.app, props } as LoadAppHookContext;
        await this._hooks.loadApp.call(context);
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return context.lifeCycles!;
      };
    });

    this._onLoadApp();
    this._onMountApp();
    this._onUnmountApp();
    this._sourceController.apply();

    this.isApplied = true;
  }

  protected _onLoadApp(): void {
    // ?????? App ??????????????????
    this._hooks.loadApp.tap(PLUGIN_SOURCE_ENTRY_NORMALIZE_SOURCE_TAP, async (context): Promise<void> => {
      const { app } = context;

      app.styles = this._sourceController.normalizeSource(app.styles, app.assetsPublicPath);
      app.scripts = this._sourceController.normalizeSource(app.scripts, app.assetsPublicPath);

      return Promise.resolve();
    });

    // ???????????????????????????
    this._hooks.loadApp.tap(PLUGIN_SOURCE_ENTRY_TAP, async (context): Promise<void> => {
      const { app } = context;

      // ????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
      if (!app.container) {
        app.container = this._containerRenderer.createElement(app);
      }

      await this._sourceController.load(context);
    });

    // ????????????????????????
    this._hooks.loadApp.tap(PLUGIN_SOURCE_ENTRY_UPDATE_LIFECYCLE_TAP, async (context): Promise<void> => {
      // ?????????????????????????????????
      const originLifeCycles = {};

      context.lifeCycles = {};
      context.lifeCycles.mount = async (props: AppProps): Promise<Record<string, AppLifeCycleFunction>> => {
        const mountContext = {
          app: context.app,
          props,
          lifeCycles: originLifeCycles,
          setLifeCycles: (lifeCycles: AppLifeCycles) => {
            Object.assign(originLifeCycles, lifeCycles);
          },
        } as MountAppHookContext;
        await this._hooks.mountApp.call(mountContext);
        return mountContext.result as Promise<Record<string, AppLifeCycleFunction>>;
      };

      context.lifeCycles.unmount = async (props: AppProps): Promise<unknown> => {
        const unmountContext = {
          app: context.app,
          props,
          lifeCycles: originLifeCycles,
        } as UnmountAppHookContext;
        await this._hooks.unmountApp.call(unmountContext);
        return unmountContext.result as Promise<Record<string, AppLifeCycleFunction>>;
      };

      return Promise.resolve();
    });
  }

  protected _onMountApp(): void {
    // Mount ?????????????????????????????????????????????
    this._hooks.mountApp.tap(PLUGIN_SOURCE_ENTRY_RENDER_CONTAINER_TAP, async (context): Promise<void> => {
      const isRendered = this._containerRenderer.render(context);
      if (!isRendered) {
        throw new VerseaError('Can not find container element.');
      }
      return Promise.resolve();
    });

    this._hooks.mountApp.tap(PLUGIN_SOURCE_ENTRY_EXEC_SOURCE_TAP, async (context): Promise<void> => {
      const { app, setLifeCycles } = context;

      if (!(app as IInternalApp)._isSourceExecuted) {
        const lifeCycles = await this._sourceController.exec(context);
        (app as IInternalApp)._isSourceExecuted = true;
        // Load ?????????????????????????????????????????? Mount ???????????????????????????????????????
        setLifeCycles(lifeCycles);
      }
    });

    // ?????? mount ????????????
    this._hooks.mountApp.tap(PLUGIN_SOURCE_ENTRY_EXEC_LIFECYCLE_TAP, async (context): Promise<void> => {
      const { lifeCycles, props } = context;
      if (lifeCycles.mount) {
        context.result = await lifeCycles.mount(props);
      }
    });
  }

  protected _onUnmountApp(): void {
    // ?????? unmount ????????????
    this._hooks.unmountApp.tap(PLUGIN_SOURCE_ENTRY_EXEC_LIFECYCLE_TAP, async (context): Promise<void> => {
      const { lifeCycles, props } = context;
      if (lifeCycles.unmount) {
        context.result = await lifeCycles.unmount(props);
      }
    });

    // ????????????
    this._hooks.unmountApp.tap(PLUGIN_SOURCE_ENTRY_REMOVE_CONTAINER_TAP, async (context): Promise<void> => {
      this._containerRenderer.render(context, null);
      return Promise.resolve();
    });
  }
}
