/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { App, AppLifeCycleFunction, AppLifeCycles, AppProps, IConfig, IHooks, provide } from '@versea/core';
import { logWarn, VerseaError } from '@versea/shared';
import { AsyncSeriesHook } from '@versea/tapable';
import { inject } from 'inversify';

import {
  PLUGIN_SOURCE_ENTRY_TAP,
  PLUGIN_SOURCE_ENTRY_NORMALIZE_SOURCE_TAP,
  PLUGIN_SOURCE_ENTRY_UPDATE_LIFECYCLE_TAP,
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

async function noop(): Promise<void> {
  return Promise.resolve();
}

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
    this._hooks.addHook('afterRenderContainer', new AsyncSeriesHook());
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
    // 规范 App 上的资源信息
    this._hooks.loadApp.tap(PLUGIN_SOURCE_ENTRY_NORMALIZE_SOURCE_TAP, async (context): Promise<void> => {
      const { app } = context;

      app.styles = this._sourceController.normalizeSource(app.styles, app.assetsPublicPath);
      app.scripts = this._sourceController.normalizeSource(app.scripts, app.assetsPublicPath);

      return noop();
    });

    // 创建容器和加载资源
    this._hooks.loadApp.tap(PLUGIN_SOURCE_ENTRY_TAP, async (context): Promise<void> => {
      const { app } = context;

      // 容器无论如何都不能二次变更，因为已经执行的资源文件已经对容器产生了不可逆的副作用
      if (!app.container) {
        app.container = this._containerRenderer.createContainerElement(app);
      }

      await this._sourceController.load(context);
    });

    // Load 阶段尝试运行资源文件
    this._hooks.loadApp.tap(PLUGIN_SOURCE_ENTRY_EXEC_SOURCE_TAP, async (context): Promise<void> => {
      const { app } = context;

      const isRendered = this._containerRenderer.renderContainer(context);
      if (isRendered) {
        await this._hooks.afterRenderContainer.call(context);

        const lifeCycles = await this._sourceController.exec(context);
        (app as IInternalApp)._isSourceExecuted = true;
        context.lifeCycles = { ...lifeCycles };
      } else {
        // 容器未渲染，代码未执行，设置空的 mount 和 unmount 函数
        context.lifeCycles = { mount: noop, unmount: noop };
      }
    });

    // 重写生命周期函数
    this._hooks.loadApp.tap(PLUGIN_SOURCE_ENTRY_UPDATE_LIFECYCLE_TAP, async (context): Promise<void> => {
      const originLifeCycles = { ...context.lifeCycles };
      context.lifeCycles!.mount = async (props: AppProps): Promise<Record<string, AppLifeCycleFunction>> => {
        const mountContext = {
          app: context.app,
          props,
          lifeCycles: originLifeCycles,
          dangerouslySetLifeCycles: (lifeCycles: AppLifeCycles) => {
            Object.assign(originLifeCycles, lifeCycles);
          },
        } as MountAppHookContext;
        await this._hooks.mountApp.call(mountContext);
        return mountContext.result as Promise<Record<string, AppLifeCycleFunction>>;
      };

      context.lifeCycles!.unmount = async (props: AppProps): Promise<unknown> => {
        const unmountContext = {
          app: context.app,
          props,
          lifeCycles: originLifeCycles,
        } as UnmountAppHookContext;
        await this._hooks.unmountApp.call(unmountContext);
        return unmountContext.result as Promise<Record<string, AppLifeCycleFunction>>;
      };

      return noop();
    });
  }

  protected _onMountApp(): void {
    // Mount 阶段加载容器并尝试运行资源文件
    this._hooks.mountApp.tap(PLUGIN_SOURCE_ENTRY_EXEC_SOURCE_TAP, async (context): Promise<void> => {
      const { app, dangerouslySetLifeCycles, props } = context;

      const isRendered = this._containerRenderer.renderContainer(context);
      if (!isRendered) {
        throw new VerseaError('Can not find container element.');
      }

      await this._hooks.afterRenderContainer.call(context);

      if (!(app as IInternalApp)._isSourceExecuted) {
        const lifeCycles = await this._sourceController.exec(context);
        (app as IInternalApp)._isSourceExecuted = true;
        // Load 阶段没有执行资源文件，因此必须在 Mount 阶段再一次设置应用的生命周期函数，替换之后默认的空函数
        dangerouslySetLifeCycles(lifeCycles);
        // Load 阶段没有执行资源文件，因此 bootstrap 生命周期之前没有赋值而被忽略，这里重新执行一次 bootstrap 生命周期
        if (!app.isBootstrapped) {
          await app.bootstrapOnMounting(props.context, props.route!);
        }
      }
    });

    // 执行 mount 生命周期
    this._hooks.mountApp.tap(PLUGIN_SOURCE_ENTRY_EXEC_LIFECYCLE_TAP, async (context): Promise<void> => {
      const { lifeCycles, props } = context;
      if (lifeCycles.mount) {
        context.result = await lifeCycles.mount(props);
      }
    });
  }

  protected _onUnmountApp(): void {
    // 执行 unmount 生命周期
    this._hooks.unmountApp.tap(PLUGIN_SOURCE_ENTRY_EXEC_LIFECYCLE_TAP, async (context): Promise<void> => {
      const { lifeCycles, props } = context;
      if (lifeCycles.unmount) {
        context.result = await lifeCycles.unmount(props);
      }
    });

    // 销毁容器
    this._hooks.unmountApp.tap(PLUGIN_SOURCE_ENTRY_REMOVE_CONTAINER_TAP, async (context): Promise<void> => {
      this._containerRenderer.renderContainer(context, null);
      return noop();
    });
  }
}
