import { IHooks, provide } from '@versea/core';
import {
  IInternalApp,
  IPluginSourceEntry,
  PLUGIN_SOURCE_ENTRY_CREATE_CONTAINER_TAP,
} from '@versea/plugin-source-entry';
import { logWarn, VerseaError } from '@versea/shared';
import { inject } from 'inversify';

import { PLUGIN_HTML_ENTRY_FETCH_SOURCE_TAP, PLUGIN_HTML_ENTRY_TAP } from '../constants';
import { IHtmlLoader } from '../loader/interface';
import { IPluginHtmlEntry } from './interface';

export * from './interface';

@provide(IPluginHtmlEntry)
export class PluginHtmlEntry implements IPluginHtmlEntry {
  protected _hooks: IHooks;

  protected _htmlLoader: IHtmlLoader;

  protected _pluginSourceEntry: IPluginSourceEntry;

  constructor(
    @inject(IHooks) hooks: IHooks,
    @inject(IHtmlLoader) htmlLoader: IHtmlLoader,
    @inject(IPluginSourceEntry) pluginSourceEntry: IPluginSourceEntry,
  ) {
    this._hooks = hooks;
    this._htmlLoader = htmlLoader;
    this._pluginSourceEntry = pluginSourceEntry;
  }

  public apply(): void {
    if (!this._pluginSourceEntry.isApplied) {
      throw new VerseaError('Please use plugin "@versea/plugin-source-entry" before "@versea/plugin-html-entry".');
    }

    this._hooks.loadApp.tap(
      PLUGIN_HTML_ENTRY_FETCH_SOURCE_TAP,
      async ({ app }) => {
        if (!app.entry) {
          return;
        }

        if ((app as IInternalApp)._documentFragment) {
          logWarn('AppConfig "documentFragment" will be rewritten by "@versea/plugin-html-entry"', app.name);
        }

        this._htmlLoader.load(app);
        return Promise.resolve();
      },
      {
        before: PLUGIN_SOURCE_ENTRY_CREATE_CONTAINER_TAP,
      },
    );

    this._hooks.loadApp.tap(
      PLUGIN_HTML_ENTRY_TAP,
      async ({ app }) => {
        this._htmlLoader.extractSourceDom(app);
        return Promise.resolve();
      },
      {
        after: PLUGIN_SOURCE_ENTRY_CREATE_CONTAINER_TAP,
      },
    );
  }
}
