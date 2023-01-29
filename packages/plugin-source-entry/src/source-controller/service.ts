import { AppLifeCycles, IApp, IHooks, provide } from '@versea/core';
import { isPromise, logError, requestIdleCallback, VerseaError } from '@versea/shared';
import { AsyncSeriesHook } from '@versea/tapable';
import { inject } from 'inversify';
import { pick } from 'ramda';

import { PLUGIN_SOURCE_ENTRY_TAP } from '../constants';
import { globalEnv } from '../global-env';
import { IInternalApp, LoadAppHookContext, MountAppHookContext, SourceScript, SourceStyle } from '../plugin/interface';
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
            if (style.code) {
              await this._runStyle(style);
              return;
            }

            if (!style.src) {
              throw new VerseaError('Can not find style source.');
            }

            return this._loadStyle(style.src, app);
          }),
        );
      }

      if (app.scripts) {
        for (const script of app.scripts) {
          if (script.async) {
            requestIdleCallback(() => void this._handleScript(script, app));
          } else {
            await this._handleScript(script, app);
          }
        }
      }

      context.result = this.getLifeCycles(window, app);
    });
  }

  public async load(context: LoadAppHookContext): Promise<void> {
    await this._hooks.loadSource.call(pick(['app', 'props'], context));
  }

  public async exec(context: MountAppHookContext): Promise<AppLifeCycles> {
    const execHookContext = pick(['app', 'props'], context) as ExecSourceHookContext;
    await this._hooks.execSource.call(execHookContext);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return execHookContext.result!;
  }

  public getLifeCycles(global: Window, app: IApp): AppLifeCycles {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    return (global as any)[(app as IInternalApp)._libraryName ?? app.name] as AppLifeCycles;
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

  public async runCodeInline(
    code: string,
    scriptElement: HTMLScriptElement,
    script: SourceScript,
    app: IApp,
  ): Promise<void> {
    if (script.src) {
      globalEnv.rawSetAttribute.call(scriptElement, 'data-origin-src', script.src);
    }

    if (script.module) {
      const blob = new Blob([code], { type: 'text/javascript' });
      scriptElement.src = URL.createObjectURL(blob);
      globalEnv.rawSetAttribute.call(scriptElement, 'type', 'module');
      return new Promise((resolve) => {
        scriptElement.onload = (): void => {
          resolve();
        };
        scriptElement.onerror = (error): void => {
          // script 执行失败，不影响主流程执行
          logError(error, app.name);
          resolve();
        };
      });
    }

    scriptElement.textContent = code;
  }

  protected async _handleScript(sourceScript: SourceScript, app: IApp): Promise<unknown> {
    if (sourceScript.code) {
      await this._runScript(sourceScript, app);
      return;
    }

    if (!sourceScript.src) {
      throw new VerseaError('Can not find script source.');
    }

    return this._loadScript(sourceScript, app);
  }

  protected async _runScript(sourceScript: SourceScript, app: IApp): Promise<void> {
    const stringCode = isPromise(sourceScript.code) ? await sourceScript.code : sourceScript.code;
    const scriptElement = globalEnv.rawCreateElement.call(document, 'script') as HTMLScriptElement;
    const promise = this.runCodeInline(stringCode ?? '', scriptElement, sourceScript, app);
    const body = globalEnv.rawGetElementsByTagName.call(document, 'body')[0];
    globalEnv.rawAppendChild.call(body, scriptElement);
    return promise;
  }

  protected async _loadScript(sourceScript: SourceScript, app: IApp): Promise<Event | string> {
    return new Promise((resolve) => {
      const body = globalEnv.rawGetElementsByTagName.call(document, 'body')[0];
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
      globalEnv.rawAppendChild.call(body, script);
    });
  }

  protected async _runStyle(sourceStyle: SourceStyle): Promise<void> {
    const stringCode = isPromise(sourceStyle.code) ? await sourceStyle.code : sourceStyle.code;
    const styleElement = globalEnv.rawCreateElement.call(document, 'style') as HTMLStyleElement;
    styleElement.textContent = stringCode ?? '';
    styleElement.setAttribute('data-origin-href', sourceStyle.src ?? '');

    const head = globalEnv.rawGetElementsByTagName.call(document, 'head')[0];
    globalEnv.rawAppendChild.call(head, styleElement);
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
