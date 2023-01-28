import { IApp, IConfig, IHooks, provide, provideValue } from '@versea/core';
import { IContainerRenderer, IPluginSourceEntry } from '@versea/plugin-source-entry';
import { DeferredContainer, VerseaError, VerseaNotFoundContainerError } from '@versea/shared';
import { inject } from 'inversify';

import { PLUGIN_AUTO_WAIT_CONTAINER_TAP } from '../constants';
import { observeChildListOnce } from '../observer';
import { delay } from '../utils';
import { IPluginAutoWaitContainer } from './interface';

export * from './interface';

const DefaultTimeOut = 10000;

// 声明默认等待容器渲染完成的超时时间
provideValue({ autoWaitContainerTimeout: DefaultTimeOut }, IConfig);

@provide(IPluginAutoWaitContainer)
export class PluginAutoWaitContainer implements IPluginAutoWaitContainer {
  protected _hooks: IHooks;

  protected _config: IConfig;

  protected _pluginSourceEntry: IPluginSourceEntry;

  protected _containerRenderer: IContainerRenderer;

  protected _deferredContainer: DeferredContainer<Record<string, unknown>>;

  constructor(
    @inject(IConfig) config: IConfig,
    @inject(IHooks) hooks: IHooks,
    @inject(IPluginSourceEntry) pluginSourceEntry: IPluginSourceEntry,
    @inject(IContainerRenderer) containerRenderer: IContainerRenderer,
  ) {
    this._config = config;
    this._hooks = hooks;
    this._pluginSourceEntry = pluginSourceEntry;
    this._containerRenderer = containerRenderer;

    observeChildListOnce((node) => {
      this._handleChildListChange(node);
    });

    this._deferredContainer = new DeferredContainer<Record<string, unknown>>();
  }

  public apply(): void {
    if (!this._pluginSourceEntry.isApplied) {
      throw new VerseaError(
        'Please use plugin "@versea/plugin-source-entry" before "@versea/plugin-auto-wait-container".',
      );
    }

    this._hooks.waitForChildContainer.tap(PLUGIN_AUTO_WAIT_CONTAINER_TAP, async ({ appProps, containerName }) => {
      if (this._containerRenderer.querySelector(`#${containerName}`)) {
        return Promise.resolve();
      }

      void this._handleTimeout(containerName, appProps.app);
      await this._deferredContainer.wait(containerName, appProps);
    });
  }

  protected _handleChildListChange(node: Node): void {
    this._deferredContainer.keys().forEach((key) => {
      if ((node as HTMLElement).querySelector(`#${key}`)) {
        this._deferredContainer.resolve(key);
        this._deferredContainer.delete(key);
      }
    });
  }

  protected async _handleTimeout(containerName: string, app: IApp): Promise<void> {
    await delay(this._config.autoWaitContainerTimeout ?? DefaultTimeOut);

    if (this._deferredContainer.has(containerName)) {
      this._deferredContainer.reject(
        containerName,
        new VerseaNotFoundContainerError(`[${app.name}]Can not find container element.`),
      );
      this._deferredContainer.delete(containerName);
    }
  }
}
