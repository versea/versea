import { AppLifeCycles, IHooks, IHooksKey, provide } from '@versea/core';
import { requestIdleCallback, VerseaError } from '@versea/shared';
import { AsyncSeriesHook } from '@versea/tapable';
import { inject } from 'inversify';
import { pick } from 'ramda';

import { VERSEA_PLUGIN_SOURCE_ENTRY_TAP } from '../constants';
import { globalEnv } from '../global-env';
import { LoadAppHookContext, MountAppHookContext, SourceScript } from '../plugin/interface';
import { ExecSourceHookContext, ISourceController, ISourceControllerKey } from './interface';

export * from './interface';

@provide(ISourceControllerKey)
export class SourceController implements ISourceController {
  protected _hooks: IHooks;

  constructor(@inject(IHooksKey) hooks: IHooks) {
    this._hooks = hooks;
    this._hooks.addHook('loadSource', new AsyncSeriesHook());
    this._hooks.addHook('execSource', new AsyncSeriesHook());
  }

  public apply(): void {
    this._hooks.execSource.tap(VERSEA_PLUGIN_SOURCE_ENTRY_TAP, async (context) => {
      const { app } = context;
      if (app.styles?.length) {
        await Promise.all(
          app.styles.map(async (style) => {
            if (!style.src || style.code) {
              throw new VerseaError('@versea/plugin-source-entry is not support inline style.');
            }
            return this._loadStyle(style.src);
          }),
        );
      }

      if (app.scripts) {
        for (const script of app.scripts) {
          if (!script.src || script.code) {
            throw new VerseaError('@versea/plugin-source-entry is not support inline script.');
          }
          if (script.async) {
            requestIdleCallback(() => void this._loadScript(script));
          }
          await this._loadScript(script);
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
      context.result = (window as any)[app.name] as AppLifeCycles;
    });
  }

  public async load(context: LoadAppHookContext): Promise<void> {
    await this._hooks.loadSource.call(pick(['app', 'props'], context));
  }

  public async exec(context: LoadAppHookContext | MountAppHookContext): Promise<AppLifeCycles> {
    const execHookContext = pick(['app', 'props'], context) as ExecSourceHookContext;
    await this._hooks.execSource.call(execHookContext);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return execHookContext.result!;
  }

  public async _loadScript(sourceScript: SourceScript): Promise<Event> {
    return new Promise((resolve, reject) => {
      const head = globalEnv.rawGetElementsByTagName.call(document, 'head')[0];
      const script = globalEnv.rawCreateElement.call(document, 'script') as HTMLScriptElement;
      script.type = sourceScript.module ? 'module' : 'text/javascript';
      script.onload = resolve;
      script.onerror = reject;
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      script.src = sourceScript.src!;
      globalEnv.rawAppendChild.call(head, script);
    });
  }

  public async _loadStyle(url: string): Promise<Event> {
    return new Promise((resolve, reject) => {
      const head = globalEnv.rawGetElementsByTagName.call(document, 'head')[0];
      const link = globalEnv.rawCreateElement.call(document, 'link') as HTMLLinkElement;
      link.type = 'text/css';
      link.rel = 'stylesheet';
      link.href = url;
      link.onload = resolve;
      link.onerror = reject;
      globalEnv.rawAppendChild.call(head, link);
    });
  }
}
