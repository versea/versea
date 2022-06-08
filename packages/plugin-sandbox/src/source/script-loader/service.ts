import { IApp, IConfig, IHooks, provide } from '@versea/core';
import { IInternalApp, IRequest, LoadSourceHookContext, SourceScript } from '@versea/plugin-source-entry';
import { Deferred, isPromise, logError, VerseaError } from '@versea/shared';
import { AsyncSeriesHook, SyncHook } from '@versea/tapable';
import { inject } from 'inversify';

import { VERSEA_PLUGIN_SANDBOX_TAP } from '../../constants';
import { globalEnv } from '../../global-env';
import { IScriptLoader, ProcessScripCodeHookContext } from './interface';

export * from './interface';

/** 不需要从 window 取的全局变量 */
const GlobalKeys = [
  'window',
  'self',
  'globalThis',
  'Array',
  'Object',
  'String',
  'Boolean',
  'Math',
  'Number',
  'Symbol',
  'Date',
  'Promise',
  'Function',
  'Proxy',
  'WeakMap',
  'WeakSet',
  'Set',
  'Map',
  'Reflect',
  'Element',
  'Node',
  'Document',
  'RegExp',
  'Error',
  'TypeError',
  'JSON',
  'isNaN',
  'parseFloat',
  'parseInt',
  'performance',
  'console',
  'decodeURI',
  'encodeURI',
  'decodeURIComponent',
  'encodeURIComponent',
  'location',
  'navigator',
  'undefined',
].join(',');

@provide(IScriptLoader)
export class ScriptLoader implements IScriptLoader {
  /** 资源文件链接和资源文件内容的 Map */
  protected _globalScripts = new Map<string, Promise<string>>();

  /** 应用名称和 script 加载完成的 Promise 的 Map */
  protected _scriptDeferred = new WeakMap<IApp, Deferred<void>>();

  protected _hooks: IHooks;

  protected _config: IConfig;

  protected _request: IRequest;

  constructor(@inject(IHooks) hooks: IHooks, @inject(IConfig) config: IConfig, @inject(IRequest) request: IRequest) {
    this._hooks = hooks;
    this._config = config;
    this._request = request;
    this._hooks.addHook('loadScript', new AsyncSeriesHook());
    this._hooks.addHook('runScript', new AsyncSeriesHook());
    this._hooks.addHook('processScriptCode', new SyncHook());
  }

  public apply(): void {
    this._hooks.loadScript.tap(VERSEA_PLUGIN_SANDBOX_TAP, async ({ app, script }) => {
      await this.ensureScriptCode(script, app);
    });

    this._hooks.runScript.tap(VERSEA_PLUGIN_SANDBOX_TAP, async ({ app, code, script }) => {
      await this.runScript(code, script, app);
    });

    this._hooks.processScriptCode.tap(VERSEA_PLUGIN_SANDBOX_TAP, (context) => {
      context.result = this._processCode(context.code, context.script, context.app);
    });
  }

  public async load({ app }: LoadSourceHookContext): Promise<void> {
    const deferred = new Deferred<void>();
    this._scriptDeferred.set(app, deferred);

    if (app.scripts) {
      void Promise.all(app.scripts.map(async (script) => this._hooks.loadScript.call({ app, script })))
        .then(() => {
          deferred.resolve();
        })
        .catch(() => {
          deferred.reject();
        });
    } else {
      deferred.resolve();
    }

    return Promise.resolve();
  }

  public dispose(app: IApp): void {
    this._scriptDeferred.delete(app);
    app.scripts = undefined;
  }

  public async ensureScriptCode(script: SourceScript, app: IApp): Promise<void> {
    const { src, code, async, isGlobal } = script;

    if (isPromise(code)) {
      // 异步脚本已经是 Promise 忽略
      if (async) return;

      script.code = await script.code;
    }

    // 没有资源文件链接或具有 code 忽略
    if (!src || code) {
      return;
    }

    // 全局资源文件链接
    if (this._globalScripts.has(src)) {
      const promise = this._globalScripts.get(src);
      script.code = async ? promise : await promise;
      return;
    }

    // 拉取资源
    const fetchScriptPromise = this._fetchScriptCode(script, app);
    if (isGlobal) {
      this._globalScripts.set(src, fetchScriptPromise);
    }
    script.code = script.async ? fetchScriptPromise : await fetchScriptPromise;
  }

  public async execScripts(app: IApp): Promise<void> {
    if (!app.scripts || !app.scripts.length) {
      return;
    }

    await Promise.all(
      app.scripts.map(async (script) => {
        const { code } = script;
        if (isPromise(code)) {
          const res = await code;
          return this._hooks.runScript.call({ app, script, code: res });
        }

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return this._hooks.runScript.call({ app, script, code: code! });
      }),
    );
  }

  public async runScript(code: string, script: SourceScript, app: IApp): Promise<void> {
    const context = { code, script, app } as ProcessScripCodeHookContext;
    this._hooks.processScriptCode.call(context);
    const resultCode = context.result;

    if ((app as IInternalApp)._inlineScript || script.module) {
      const scriptElement = globalEnv.rawCreateElement.call(document, 'script') as HTMLScriptElement;
      const body = this._getDocumentBody(app);
      const promise = this._runCodeInline(resultCode, scriptElement, script, app);
      body.appendChild(scriptElement);
      return promise;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      new Function(resultCode).call(window);
    } catch (error) {
      // script 执行失败，不影响主流程执行
      logError(error, app.name);
    }
  }

  /** 获取 script 资源内容 */
  protected async _fetchScriptCode(script: SourceScript, app: IApp): Promise<string> {
    const { src, isGlobal } = script;

    /* eslint-disable @typescript-eslint/no-non-null-assertion */
    try {
      return await this._request.fetch(src!, app);
    } catch (error) {
      if (isGlobal) {
        this._globalScripts.delete(src!);
      }

      // script 获取失败，不影响主流程执行
      logError(error, app.name);
      return `console.error('[versea-app] ${app.name} load "${src!}" error & exec script.')`;
    }
    /* eslint-enable @typescript-eslint/no-non-null-assertion */
  }

  protected _processCode(code: string, script: SourceScript, app: IApp): string {
    if (app.sandbox && !script.module) {
      globalEnv.rawWindow.__VERSEA_APP_PROXY_WINDOW__ = app.sandbox.proxyWindow;
      return `;(function(proxyWindow){with(proxyWindow.__VERSEA_APP_WINDOW__){(function(${GlobalKeys}){;${code}\n}).call(proxyWindow,${GlobalKeys})}})(window.__VERSEA_APP_PROXY_WINDOW__);`;
    }

    return code;
  }

  /** 获取文档 body 节点 */
  protected _getDocumentBody(app: IApp): Element {
    let body: Element | null = globalEnv.rawGetElementsByTagName.call(document, 'body')[0];
    if (app.container) {
      body = globalEnv.rawQuerySelector.call(app.container, 'versea-app-body');
      if (!body) {
        throw new VerseaError('Can not find "versea-app-body" element');
      }
    }
    return body;
  }

  /** 以 inlineScript 的方式运行脚本代码  */
  protected async _runCodeInline(
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
    } else {
      scriptElement.textContent = code;
    }

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
}
