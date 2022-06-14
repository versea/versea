import { AppLifeCycles, IApp, IHooks, provide } from '@versea/core';
import { logError, requestIdleCallback, VerseaError } from '@versea/shared';
import { AsyncSeriesHook } from '@versea/tapable';
import { inject } from 'inversify';
import { pick } from 'ramda';

import { PLUGIN_SOURCE_ENTRY_TAP } from '../constants';
import { globalEnv } from '../global-env';
import { LoadAppHookContext, MountAppHookContext, SourceScript, SourceStyle } from '../plugin/interface';
import { completionPath } from '../utils';
import { ExecSourceHookContext, ISourceController } from './interface';

export * from './interface';

function removeEvent(target: HTMLLinkElement | HTMLScriptElement): void {
  target.onerror = null;
  target.onload = null;
}

@provide(ISourceController)
export class SourceController implements ISourceController {
  protected _hooks: IHooks;

  constructor(@inject(IHooks) hooks: IHooks) {
    this._hooks = hooks;
    this._hooks.addHook('loadSource', new AsyncSeriesHook());
    this._hooks.addHook('execSource', new AsyncSeriesHook());
  }

  public apply(): void {
    this._hooks.execSource.tap(PLUGIN_SOURCE_ENTRY_TAP, async (context) => {
      const { app } = context;
      if (app.styles?.length) {
        await Promise.all(
          app.styles.map(async (style) => {
            if (!style.src || style.code) {
              throw new VerseaError('@versea/plugin-source-entry is not support inline style.');
            }
            return this._loadStyle(style.src, app);
          }),
        );
      }

      if (app.scripts) {
        for (const script of app.scripts) {
          if (!script.src || script.code) {
            throw new VerseaError('@versea/plugin-source-entry is not support inline script.');
          }
          if (script.async) {
            requestIdleCallback(() => void this._loadScript(script, app));
          }
          await this._loadScript(script, app);
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

  public normalizeSource<T extends SourceScript | SourceStyle>(
    sources?: (T | string)[],
    assetsPublicPath?: string,
  ): T[] {
    return sources
      ? sources.map((source) =>
          typeof source === 'string'
            ? ({
                src: completionPath(source, assetsPublicPath),
              } as T)
            : {
                ...source,
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                src: completionPath(source.src!, assetsPublicPath),
              },
        )
      : [];
  }

  public findScript(src: string | undefined, app: IApp): SourceScript | undefined {
    return this._findSource(src, app.scripts);
  }

  public findStyle(src: string | undefined, app: IApp): SourceStyle | undefined {
    return this._findSource(src, app.styles);
  }

  public insertScript(script: SourceScript, app: IApp): void {
    this._insertSource(script, app.scripts);
  }

  public insertStyle(style: SourceStyle, app: IApp): void {
    this._insertSource(style, app.styles);
  }

  public removeScripts(app: IApp): void {
    app.scripts = undefined;
  }

  public removeStyles(app: IApp): void {
    app.styles = undefined;
  }

  protected async _loadScript(sourceScript: SourceScript, app: IApp): Promise<Event | string> {
    return new Promise((resolve) => {
      const head = globalEnv.rawGetElementsByTagName.call(document, 'head')[0];
      const script = globalEnv.rawCreateElement.call(document, 'script') as HTMLScriptElement;
      script.type = sourceScript.module ? 'module' : 'text/javascript';
      script.onload = (event): void => {
        removeEvent(script);
        resolve(event);
      };
      script.onerror = (error): void => {
        logError(error, app.name);
        removeEvent(script);
        resolve(error);
      };
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      script.src = sourceScript.src!;
      globalEnv.rawAppendChild.call(head, script);
    });
  }

  protected async _loadStyle(url: string, app: IApp): Promise<Event | string> {
    return new Promise((resolve) => {
      const head = globalEnv.rawGetElementsByTagName.call(document, 'head')[0];
      const link = globalEnv.rawCreateElement.call(document, 'link') as HTMLLinkElement;
      link.type = 'text/css';
      link.rel = 'stylesheet';
      link.href = url;
      link.onload = (event): void => {
        removeEvent(link);
        resolve(event);
      };
      link.onerror = (error): void => {
        logError(error, app.name);
        removeEvent(link);
        resolve(error);
      };
      globalEnv.rawAppendChild.call(head, link);
    });
  }

  protected _findSource<T extends SourceScript | SourceStyle>(src?: string, sources?: T[]): T | undefined {
    if (!sources || !src) {
      return;
    }

    return sources.find((source) => source.src === src);
  }

  protected _insertSource<T extends SourceScript | SourceStyle>(source: T, sources?: T[]): void {
    if (!source.src || !sources) {
      return;
    }

    const index = sources.findIndex((item) => item.src === source.src);
    if (index < 0) {
      sources.push(source);
    } else {
      sources.splice(index, 1, source);
    }
  }
}
