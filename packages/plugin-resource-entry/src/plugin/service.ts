/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  AppHookFunction,
  AppHooks,
  AppProps,
  IApp,
  IConfig,
  IConfigKey,
  IHooks,
  IHooksKey,
  provide,
  provideValue,
  RouteMeta,
} from '@versea/core';
import { VerseaError } from '@versea/shared';
import { AsyncSeriesHook } from '@versea/tapable';
import { inject } from 'inversify';
import { pick } from 'ramda';

import {
  VERSEA_PLUGIN_RESOURCE_ENTRY_TAP,
  VERSEA_PLUGIN_RESOURCE_ENTRY_CREATE_CONTAINER,
  VERSEA_PLUGIN_RESOURCE_ENTRY_LOAD_RESOURCE,
  VERSEA_PLUGIN_RESOURCE_ENTRY_MOUNT_CONTAINER,
  VERSEA_PLUGIN_RESOURCE_ENTRY_UNMOUNT_CONTAINER,
} from '../constants';
import { IContainerRender, IContainerRenderKey } from '../document-fragment-render/interface';
import { IResourceLoader, IResourceLoaderKey } from '../resource-loader/interface';
import {
  LoadAppHookContext,
  MountAppHookContext,
  UnmountAppHookContext,
  IPluginResourceEntry,
  IPluginResourceEntryKey,
} from './interface';

export * from './interface';

provideValue({ defaultContainer: '' }, IConfigKey);

@provide(IPluginResourceEntryKey)
export class PluginResourceEntry implements IPluginResourceEntry {
  protected _config: IConfig;

  protected _hooks: IHooks;

  protected _documentFragmentRender: IContainerRender;

  protected _resourceLoader: IResourceLoader;

  constructor(
    @inject(IConfigKey) config: IConfig,
    @inject(IHooksKey) hooks: IHooks,
    @inject(IContainerRenderKey) documentFragmentRender: IContainerRender,
    @inject(IResourceLoaderKey) resourceLoader: IResourceLoader,
  ) {
    this._config = config;
    this._hooks = hooks;
    this._documentFragmentRender = documentFragmentRender;
    this._resourceLoader = resourceLoader;
    this._hooks.addHook('loadApp', new AsyncSeriesHook());
    this._hooks.addHook('mountApp', new AsyncSeriesHook());
    this._hooks.addHook('unmountApp', new AsyncSeriesHook());
  }

  public apply(): void {
    this._hooks.beforeRegisterApp.tap(VERSEA_PLUGIN_RESOURCE_ENTRY_TAP, ({ config }) => {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const self = this;
      if (config.loadApp) {
        return;
      }

      config.loadApp = async function (this: IApp, props: AppProps): Promise<AppHooks> {
        const context = {
          app: this,
          config,
          props,
        } as LoadAppHookContext;
        await self._hooks.loadApp.call(context);
        return context.appHooks!;
      };
    });

    this._hooks.loadApp.tap(VERSEA_PLUGIN_RESOURCE_ENTRY_CREATE_CONTAINER, async (context): Promise<void> => {
      this._createContainerElement(context);
      return Promise.resolve();
    });

    this._hooks.loadApp.tap(VERSEA_PLUGIN_RESOURCE_ENTRY_LOAD_RESOURCE, async (context): Promise<void> => {
      const { config } = context;
      const appHooks = await this._resourceLoader.load(config);
      context.appHooks = { ...appHooks };
    });

    this._hooks.loadApp.tap(VERSEA_PLUGIN_RESOURCE_ENTRY_TAP, async (context): Promise<void> => {
      const { mount, unmount } = context.appHooks!;
      if (mount) {
        context.appHooks!.mount = async (props: AppProps): Promise<Record<string, AppHookFunction>> => {
          const mountContext = {
            ...pick(['app', 'config', 'container'], context),
            mount,
            props,
          } as MountAppHookContext;
          await this._hooks.mountApp.call(mountContext);
          return mountContext.result as Promise<Record<string, AppHookFunction>>;
        };
      }
      if (unmount) {
        context.appHooks!.unmount = async (props: AppProps): Promise<unknown> => {
          const unmountContext = {
            ...pick(['app', 'config', 'container'], context),
            unmount,
            props,
          } as UnmountAppHookContext;
          await this._hooks.unmountApp.call(unmountContext);
          return unmountContext.result as Promise<Record<string, AppHookFunction>>;
        };
      }
      return Promise.resolve();
    });

    this._hooks.mountApp.tap(VERSEA_PLUGIN_RESOURCE_ENTRY_MOUNT_CONTAINER, async (context): Promise<void> => {
      const { container: element } = context;
      const containerElement = this.getContainerElement(context);
      if (containerElement && !containerElement.contains(element)) {
        containerElement.appendChild(element);
      }
      return Promise.resolve();
    });

    this._hooks.mountApp.tap(VERSEA_PLUGIN_RESOURCE_ENTRY_TAP, async (context): Promise<void> => {
      const { mount, props } = context;
      context.result = await mount!(props);
    });

    this._hooks.unmountApp.tap(VERSEA_PLUGIN_RESOURCE_ENTRY_TAP, async (context): Promise<void> => {
      const { unmount, props } = context;
      context.result = await unmount!(props);
    });

    this._hooks.unmountApp.tap(VERSEA_PLUGIN_RESOURCE_ENTRY_UNMOUNT_CONTAINER, async (context): Promise<void> => {
      const { container: element } = context;
      const containerElement = this.getContainerElement(context);
      if (containerElement?.contains(element)) {
        while (containerElement.firstChild) {
          containerElement.removeChild(containerElement.firstChild);
        }
      }
      return Promise.resolve();
    });
  }

  public getContainerElement(context: MountAppHookContext | UnmountAppHookContext): HTMLElement {
    const { config, app, props } = context;

    // 从 route 获取容器
    if (props.route) {
      // 解构出应用对应的 meta 信息
      const meta: RouteMeta =
        props.route.apps[0] === app ? props.route.meta : (props.route.meta[app.name] as RouteMeta);
      if (meta.parentContainerName) {
        return this._queryContainerElement(`#${meta.parentContainerName}`);
      }
    }

    // 从 config 获取容器
    if (config.container) {
      return this._queryContainerElement(config.container);
    }

    // 获取默认容器
    if (this._config.defaultContainer) {
      return this._queryContainerElement(this._config.defaultContainer);
    }

    throw new VerseaError('Can not find container element.');
  }

  protected _queryContainerElement(selector: string): HTMLElement {
    const containerElement = document.querySelector(selector);
    if (!containerElement) {
      throw new VerseaError('Can not find container element.');
    }
    return containerElement as HTMLElement;
  }

  protected _createContainerElement(context: LoadAppHookContext): void {
    const { app, config } = context;

    const containerElement = this._documentFragmentRender.createElement(app, config);
    context.container = containerElement;

    // 在 App 上保存一份 container 信息
    app.container = containerElement;
  }
}
