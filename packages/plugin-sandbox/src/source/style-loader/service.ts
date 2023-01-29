import { IApp, IConfig, IHooks, provide } from '@versea/core';
import {
  IInternalApp,
  IRequest,
  ISourceController,
  LoadSourceHookContext,
  SourceStyle,
} from '@versea/plugin-source-entry';
import { Deferred, logError, VerseaError, isPromise } from '@versea/shared';
import { AsyncSeriesHook } from '@versea/tapable';
import { inject } from 'inversify';

import { PLUGIN_SANDBOX_TAP } from '../../constants';
import { globalEnv } from '../../global-env';
import { ILoadEvent } from '../load-event/interface';
import { IScopedCSS } from '../scoped-css/interface';
import { IStyleLoader } from './interface';

export * from './interface';

@provide(IStyleLoader)
export class StyleLoader implements IStyleLoader {
  /** 资源文件链接和资源文件内容的 Map */
  protected _globalStyles = new Map<string, Promise<string>>();

  /** 应用名称和 style 加载完成的 Promise 的 Map */
  protected _styleDeferred = new WeakMap<IApp, Deferred<void>>();

  protected _hooks: IHooks;

  protected _config: IConfig;

  protected _request: IRequest;

  protected _sourceController: ISourceController;

  protected _loadEvent: ILoadEvent;

  protected _scopedCSS: IScopedCSS;

  constructor(
    @inject(IHooks) hooks: IHooks,
    @inject(IConfig) config: IConfig,
    @inject(IRequest) request: IRequest,
    @inject(ISourceController) sourceController: ISourceController,
    @inject(ILoadEvent) loadEvent: ILoadEvent,
    @inject(IScopedCSS) scopedCSS: IScopedCSS,
  ) {
    this._hooks = hooks;
    this._config = config;
    this._request = request;
    this._sourceController = sourceController;
    this._loadEvent = loadEvent;
    this._scopedCSS = scopedCSS;
    this._hooks.addHook('loadStyle', new AsyncSeriesHook());
    this._hooks.addHook('loadDynamicStyle', new AsyncSeriesHook());
  }

  public apply(): void {
    this._scopedCSS.apply();
    this._hooks.loadStyle.tap(PLUGIN_SANDBOX_TAP, async ({ app, style }) => {
      await this.ensureCode(style, app);
      this._appendStyleElement(style, app);
    });

    this._hooks.loadDynamicStyle.tap(
      PLUGIN_SANDBOX_TAP,
      async ({ app, style, cachedStyle, originElement, styleElement }) => {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const _style = cachedStyle ?? style;
        if (!cachedStyle) {
          this._sourceController.insertStyle(style, app);
        }
        try {
          await this.ensureCode(_style, app);
          styleElement.textContent = _style.code as string;
          this.scopeCSS(styleElement, _style, app);
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
    this._styleDeferred.set(app, deferred);

    if (app.styles) {
      void Promise.all(
        app.styles.map(async (style) => {
          try {
            await this._hooks.loadStyle.call({ app, style });
          } catch (error) {
            // CSS 样式加载失败，不影响主逻辑运行
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
    return this._styleDeferred.get(app)?.promise;
  }

  public dispose(app: IApp): void {
    this._styleDeferred.delete(app);
    if (!this._getPersistentSourceCode(app)) {
      this._sourceController.removeStyles(app);
    }
  }

  public async ensureCode(style: SourceStyle, app: IApp): Promise<void> {
    const { src, code, isGlobal } = style;

    if (isPromise(code)) {
      style.code = await style.code;
    }

    // 没有资源文件链接或具有 code 忽略
    if (!src || code) {
      return;
    }

    // 全局资源文件链接
    if (this._globalStyles.has(src)) {
      style.code = await this._globalStyles.get(src);
      return;
    }

    // 拉取资源
    const fetchStylePromise = this._fetchStyleCode(style, app);
    if (isGlobal) {
      this._globalStyles.set(src, fetchStylePromise);
    }
    style.code = await fetchStylePromise;
  }

  public addDynamicStyle(
    style: SourceStyle,
    app: IApp,
    originElement: HTMLLinkElement,
    styleElement: HTMLStyleElement,
  ): void {
    const cachedStyle = this._sourceController.findStyle(style.src, app);
    void this._hooks.loadDynamicStyle.call({
      style,
      cachedStyle,
      app,
      originElement,
      styleElement,
    });
  }

  public scopeCSS(styleElement: HTMLStyleElement, style: SourceStyle, app: IApp): void {
    const scopedCSS = (app as IInternalApp)._scopedCSS ?? this._config.scopedCSS;
    if (scopedCSS) {
      this._scopedCSS.process(styleElement, style, app);
    }
  }

  /** 获取 style 资源内容 */
  protected async _fetchStyleCode(style: SourceStyle, app: IApp): Promise<string> {
    const { src, isGlobal } = style;

    try {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return await this._request.fetch(src!, app);
    } catch (error) {
      if (isGlobal) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this._globalStyles.delete(src!);
      }

      throw error;
    }
  }

  /** 添加 style 标签 */
  protected _appendStyleElement(style: SourceStyle, app: IApp): void {
    const { src, code, placeholder } = style;
    const { rawCreateElement, rawGetElementsByTagName, rawAppendChild, rawReplaceChild } = globalEnv;

    const styleElement = rawCreateElement.call(document, 'style') as HTMLStyleElement;
    styleElement.textContent = (code as string) ?? '';
    styleElement.__VERSEA_APP_LINK_PATH__ = src;
    styleElement.setAttribute('data-origin-href', src ?? '');

    this.scopeCSS(styleElement, style, app);

    if (placeholder?.parentNode) {
      rawReplaceChild.call(placeholder.parentNode, styleElement, placeholder);
      return;
    }

    let head: Element | null = rawGetElementsByTagName.call(document, 'head')[0];
    if (app.container) {
      head = globalEnv.rawQuerySelector.call(app.container, 'versea-app-head');
      if (!head) {
        throw new VerseaError('Can not find "versea-app-head" element');
      }
    }

    rawAppendChild.call(head, styleElement);
  }

  protected _getPersistentSourceCode(app: IApp): boolean | undefined {
    return (app as IInternalApp)._isPersistentSourceCode ?? this._config.isPersistentSourceCode;
  }
}
