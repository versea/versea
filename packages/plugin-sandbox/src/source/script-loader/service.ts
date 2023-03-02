import { IApp, IConfig, IHooks, provide } from '@versea/core';
import {
  IInternalApp,
  IRequest,
  ISourceController,
  LoadSourceHookContext,
  SourceScript,
} from '@versea/plugin-source-entry';
import { Deferred, isPromise, logError, requestIdleCallback, VerseaError } from '@versea/shared';
import { AsyncSeriesHook, SyncHook } from '@versea/tapable';
import { inject } from 'inversify';

import { PLUGIN_SANDBOX_TAP } from '../../constants';
import { globalEnv } from '../../global-env';
import { ILoadEvent } from '../load-event/interface';
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
  protected readonly _globalScripts = new Map<string, Promise<string>>();

  /** 应用名称和 script 加载完成的 Promise 的 Map */
  protected readonly _scriptDeferred = new WeakMap<IApp, Deferred<void>>();

  protected readonly _hooks: IHooks;

  protected readonly _config: IConfig;

  protected readonly _request: IRequest;

  protected readonly _sourceController: ISourceController;

  protected readonly _loadEvent: ILoadEvent;

  constructor(
    @inject(IHooks) hooks: IHooks,
    @inject(IConfig) config: IConfig,
    @inject(IRequest) request: IRequest,
    @inject(ISourceController) sourceController: ISourceController,
    @inject(ILoadEvent) loadEvent: ILoadEvent,
  ) {
    this._hooks = hooks;
    this._config = config;
    this._request = request;
    this._sourceController = sourceController;
    this._loadEvent = loadEvent;
    this._hooks.addHook('loadScript', new AsyncSeriesHook());
    this._hooks.addHook('loadDynamicScript', new AsyncSeriesHook());
    this._hooks.addHook('runScript', new AsyncSeriesHook());
    this._hooks.addHook('processScriptCode', new SyncHook());
    this._hooks.addHook('beforeRunDynamicInlineScript', new SyncHook());
  }

  public apply(): void {
    this._hooks.loadScript.tap(PLUGIN_SANDBOX_TAP, async ({ app, script }) => {
      await this.ensureCode(script, app);
    });

    this._hooks.runScript.tap(PLUGIN_SANDBOX_TAP, async ({ app, code, script, element, appendToBody }) => {
      await this._runScript(code, script, app, element, appendToBody);
    });

    this._hooks.processScriptCode.tap(PLUGIN_SANDBOX_TAP, (context) => {
      context.result = this._processCode(context.code, context.script, context.app);
    });

    this._hooks.loadDynamicScript.tap(
      PLUGIN_SANDBOX_TAP,
      async ({ app, script, scriptElement, originElement, cachedScript }) => {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const _script = cachedScript ?? script;
        if (!cachedScript) {
          this._sourceController.insertScript(script, app);
        }

        try {
          await this.ensureCode(_script, app);
          await this._hooks.runScript.call({
            script: _script,
            app,
            code: _script.code as string,
            element: scriptElement,
          });
          this._loadEvent.dispatchOnLoadEvent(originElement);
        } catch (error) {
          logError(error, app.name);
          this._loadEvent.dispatchOnErrorEvent(originElement);
        }
      },
    );
  }

  public load({ app }: LoadSourceHookContext): void {
    const deferred = new Deferred<void>();
    this._scriptDeferred.set(app, deferred);

    if (app.scripts) {
      void Promise.all(
        app.scripts.map(async (script) => {
          try {
            await this._hooks.loadScript.call({ app, script });
          } catch (error) {
            // JS 加载失败，不影响主逻辑运行
            logError(error, app.name);
          }
        }),
      )
        .then(() => {
          deferred.resolve();
        })
        .catch(() => {
          deferred.reject();
        });
    } else {
      deferred.resolve();
    }
  }

  public async waitLoaded(app: IApp): Promise<void> {
    return this._scriptDeferred.get(app)?.promise;
  }

  public dispose(app: IApp): void {
    this._scriptDeferred.delete(app);
    if (!this._getPersistentSourceCode(app)) {
      app.scripts = undefined;
    }
  }

  public async ensureCode(script: SourceScript, app?: IApp): Promise<void> {
    const { src, code, async, isGlobal } = script;

    if (isPromise(code)) {
      // 异步脚本 code 是 Promise 不用处理，等到执行时再处理
      // 非异步脚本 cod 是 Promise 需要转化成返回值
      if (!async) {
        script.code = await script.code;
      }
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

    script.code = async ? fetchScriptPromise : await fetchScriptPromise;
  }

  public async exec(app: IApp): Promise<void> {
    if (!app.scripts || !app.scripts.length) {
      return;
    }

    for (const script of app.scripts) {
      if (script.async) {
        requestIdleCallback(() => void this._execScript(script, app));
      } else {
        await this._execScript(script, app);
      }
    }
  }

  public addDynamicScript(
    script: SourceScript,
    app: IApp,
    originElement: HTMLScriptElement,
  ): Comment | HTMLScriptElement {
    const cachedScript = this._sourceController.findScript(script.src, app);
    const scriptElement = this.createElementForRunScript(script, app);
    void this._hooks.loadDynamicScript.call({
      script,
      cachedScript,
      app,
      originElement,
      scriptElement,
    });
    return scriptElement;
  }

  public createElementForRunScript(script: SourceScript, app: IApp): Comment | HTMLScriptElement {
    if ((app as IInternalApp)._inlineScript || script.module) {
      return globalEnv.rawCreateElement.call(document, 'script') as HTMLScriptElement;
    }

    return document.createComment(
      `${script.src ? `script with src='${script.src}'` : 'inline script'} extract by versea`,
    );
  }

  protected async _execScript(script: SourceScript, app: IApp): Promise<void> {
    let stringCode = script.code;
    if (!stringCode) {
      return;
    }

    if (isPromise(stringCode)) {
      try {
        stringCode = await stringCode;
      } catch (error) {
        logError(error, app.name);
        stringCode = '';
      }
    }
    const element = this.createElementForRunScript(script, app);
    await this._hooks.runScript.call({ app, script, code: stringCode, element, appendToBody: true });
  }

  protected async _runScript(
    code: string,
    script: SourceScript,
    app: IApp,
    element: Comment | HTMLScriptElement,
    appendToBody?: boolean,
  ): Promise<void> {
    let resultCode = code;
    if (!script.ignore) {
      const context = { code, script, app } as ProcessScripCodeHookContext;
      this._hooks.processScriptCode.call(context);
      resultCode = context.result;
    }

    if ((app as IInternalApp)._inlineScript || script.module) {
      const promise = this._sourceController.runCodeInline(resultCode, element as HTMLScriptElement, script, app);
      if (appendToBody) {
        const body = this._getDocumentBody(app);
        body.appendChild(element);
      }
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
  protected async _fetchScriptCode(script: SourceScript, app?: IApp): Promise<string> {
    const { src, isGlobal } = script;

    /* eslint-disable @typescript-eslint/no-non-null-assertion */
    try {
      return await this._request.fetch(src!, app);
    } catch (error) {
      if (isGlobal) {
        this._globalScripts.delete(src!);
      }

      throw error;
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
      body = app.container.querySelector('versea-app-body');
      if (!body) {
        throw new VerseaError('Can not find "versea-app-body" element');
      }
    }

    return body;
  }

  protected _getPersistentSourceCode(app: IApp): boolean | undefined {
    return (app as IInternalApp)._isPersistentSourceCode ?? this._config.isPersistentSourceCode;
  }
}
