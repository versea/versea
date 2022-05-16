/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  App,
  AppLifeCycleFunction,
  AppLifeCycles,
  AppProps,
  IConfig,
  IConfigKey,
  IHooks,
  IHooksKey,
  provide,
  provideValue,
} from '@versea/core';
import { VerseaError } from '@versea/shared';
import { AsyncSeriesHook } from '@versea/tapable';
import { inject } from 'inversify';
import { pick } from 'ramda';

import { SourceScript, SourceStyle } from '..';
import {
  VERSEA_PLUGIN_SOURCE_ENTRY_TAP,
  VERSEA_PLUGIN_SOURCE_ENTRY_NORMALIZE_SOURCE_TAP,
  VERSEA_PLUGIN_SOURCE_ENTRY_UPDATE_LIFECYCLE_TAP,
  VERSEA_PLUGIN_SOURCE_ENTRY_EXEC_SOURCE_TAP,
  VERSEA_PLUGIN_SOURCE_ENTRY_EXEC_LIFECYCLE_TAP,
  VERSEA_PLUGIN_SOURCE_ENTRY_REMOVE_CONTAINER_TAP,
} from '../constants';
import { IContainerRender, IContainerRenderKey } from '../container-render/interface';
import { ISourceController, ISourceControllerKey } from '../source-controller/interface';
import {
  LoadAppHookContext,
  MountAppHookContext,
  UnmountAppHookContext,
  IPluginSourceEntry,
  IPluginSourceEntryKey,
} from './interface';

export * from './interface';

provideValue({ defaultContainer: '' }, IConfigKey);

App.defineProp('disableRenderContainer', { validator: (value) => value === undefined || typeof value === 'boolean' });

async function noop(): Promise<void> {
  return Promise.resolve();
}

@provide(IPluginSourceEntryKey)
export class PluginSourceEntry implements IPluginSourceEntry {
  public isApplied = false;

  protected _config: IConfig;

  protected _hooks: IHooks;

  protected _containerRender: IContainerRender;

  protected _sourceController: ISourceController;

  constructor(
    @inject(IConfigKey) config: IConfig,
    @inject(IHooksKey) hooks: IHooks,
    @inject(IContainerRenderKey) containerRender: IContainerRender,
    @inject(ISourceControllerKey) sourceController: ISourceController,
  ) {
    this._config = config;
    this._hooks = hooks;
    this._containerRender = containerRender;
    this._sourceController = sourceController;
    this._hooks.addHook('loadApp', new AsyncSeriesHook());
    this._hooks.addHook('mountApp', new AsyncSeriesHook());
    this._hooks.addHook('unmountApp', new AsyncSeriesHook());
  }

  public apply(): void {
    this._hooks.beforeRegisterApp.tap(VERSEA_PLUGIN_SOURCE_ENTRY_TAP, ({ config }) => {
      if (config.loadApp) {
        return;
      }

      config.loadApp = async (props: AppProps): Promise<AppLifeCycles> => {
        const context = {
          app: props.app,
          config,
          props,
        } as LoadAppHookContext;
        await this._hooks.loadApp.call(context);
        return context.lifeCycles!;
      };
    });

    this._tapLoadApp();
    this._tapMountApp();
    this._tapUnMountApp();
    this._sourceController.apply();

    this.isApplied = true;
  }

  protected _tapLoadApp(): void {
    // 生成 app 上的资源信息
    this._hooks.loadApp.tap(VERSEA_PLUGIN_SOURCE_ENTRY_NORMALIZE_SOURCE_TAP, async (context): Promise<void> => {
      const { app, config } = context;
      app.styles = this._normalizeSource(config.styles);
      app.scripts = this._normalizeSource(config.scripts);
      return Promise.resolve();
    });

    // 创建容器和加载资源
    this._hooks.loadApp.tap(VERSEA_PLUGIN_SOURCE_ENTRY_TAP, async (context): Promise<void> => {
      const { app, config } = context;
      if (!app.disableRenderContainer) {
        app.container = this._containerRender.createElement(app, config);
      }
      await this._sourceController.load(context);
    });

    // Load 阶段尝试运行资源文件
    this._hooks.loadApp.tap(VERSEA_PLUGIN_SOURCE_ENTRY_EXEC_SOURCE_TAP, async (context): Promise<void> => {
      const { app } = context;
      const isRendered = this._containerRender.renderContainer(context);
      if (isRendered) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
        (app as any)._isSourceExecuted = true;
        const lifeCycles = await this._sourceController.exec(context);
        context.lifeCycles = { ...lifeCycles };
      } else {
        context.lifeCycles = { mount: noop, unmount: noop };
      }
    });

    // 重写 lifeCycles
    this._hooks.loadApp.tap(VERSEA_PLUGIN_SOURCE_ENTRY_UPDATE_LIFECYCLE_TAP, async (context): Promise<void> => {
      const originLifeCycles = { ...context.lifeCycles };
      context.lifeCycles!.mount = async (props: AppProps): Promise<Record<string, AppLifeCycleFunction>> => {
        const mountContext = {
          ...pick(['app', 'config'], context),
          lifeCycles: originLifeCycles,
          props,
          dangerouslySetLifeCycles: (lifeCycles: AppLifeCycles) => {
            Object.assign(originLifeCycles, lifeCycles);
          },
        } as MountAppHookContext;
        await this._hooks.mountApp.call(mountContext);
        return mountContext.result as Promise<Record<string, AppLifeCycleFunction>>;
      };

      context.lifeCycles!.unmount = async (props: AppProps): Promise<unknown> => {
        const unmountContext = {
          ...pick(['app', 'config'], context),
          lifeCycles: originLifeCycles,
          props,
        } as UnmountAppHookContext;
        await this._hooks.unmountApp.call(unmountContext);
        return unmountContext.result as Promise<Record<string, AppLifeCycleFunction>>;
      };

      return Promise.resolve();
    });
  }

  protected _tapMountApp(): void {
    // Mount 阶段加载容器并尝试运行资源文件
    this._hooks.mountApp.tap(VERSEA_PLUGIN_SOURCE_ENTRY_EXEC_SOURCE_TAP, async (context): Promise<void> => {
      const { app, dangerouslySetLifeCycles, props } = context;

      const isRendered = this._containerRender.renderContainer(context);
      if (!isRendered) {
        throw new VerseaError('Can not find container element.');
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
      if (!(app as any)._isSourceExecuted) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
        (app as any)._isSourceExecuted = true;
        const lifeCycles = await this._sourceController.exec(context);
        // 重新设置应用的生命周期函数
        dangerouslySetLifeCycles(lifeCycles);
        // 在 Load 阶段可能没有执行资源文件，因此 bootstrap 可能之前被忽略，这里重新执行 bootstrap 生命周期
        if (!app.isBootstrapped) {
          await app.bootstrapOnMounting(props.context, props.route!);
        }
      }
    });

    // 执行 mount 生命周期
    this._hooks.mountApp.tap(VERSEA_PLUGIN_SOURCE_ENTRY_EXEC_LIFECYCLE_TAP, async (context): Promise<void> => {
      const { lifeCycles, props } = context;
      if (lifeCycles.mount) {
        context.result = await lifeCycles.mount(props);
      }
    });
  }

  protected _tapUnMountApp(): void {
    // 执行 unmount 生命周期
    this._hooks.unmountApp.tap(VERSEA_PLUGIN_SOURCE_ENTRY_EXEC_LIFECYCLE_TAP, async (context): Promise<void> => {
      const { lifeCycles, props } = context;
      if (lifeCycles.unmount) {
        context.result = await lifeCycles.unmount(props);
      }
    });

    // 销毁容器
    this._hooks.unmountApp.tap(VERSEA_PLUGIN_SOURCE_ENTRY_REMOVE_CONTAINER_TAP, async (context): Promise<void> => {
      this._containerRender.renderContainer(context, null);
      return Promise.resolve();
    });
  }

  protected _normalizeSource<T extends SourceScript | SourceStyle>(sources?: (T | string)[]): T[] {
    return sources
      ? sources.map((source) =>
          typeof source === 'string'
            ? ({
                src: source,
              } as T)
            : source,
        )
      : [];
  }
}
