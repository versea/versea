import { IApp, IConfig, IHooks, provide } from '@versea/core';
import { IInternalApp, IRequest, LoadSourceHookContext, SourceStyle } from '@versea/plugin-source-entry';
import { Deferred, logError, VerseaError } from '@versea/shared';
import { AsyncSeriesHook } from '@versea/tapable';
import { inject } from 'inversify';

import { VERSEA_PLUGIN_SANDBOX_TAP } from '../../constants';
import { globalEnv } from '../../global-env';
import { IScopedCSS } from '../scoped-css/interface';
import { IStyleLoader } from './interface';

export * from './interface';

@provide(IStyleLoader)
export class StyleLoader implements IStyleLoader {
  /** 资源文件链接和资源文件内容的 Map */
  protected _globalStyles = new Map<string, string>();

  /** 应用名称和 style 加载渲染完成的 Promise 的 Map */
  protected _styleDeferred = new WeakMap<IApp, Deferred<void>>();

  protected _hooks: IHooks;

  protected _config: IConfig;

  protected _request: IRequest;

  protected _scopedCSS: IScopedCSS;

  constructor(
    @inject(IHooks) hooks: IHooks,
    @inject(IConfig) config: IConfig,
    @inject(IRequest) request: IRequest,
    @inject(IScopedCSS) scopedCSS: IScopedCSS,
  ) {
    this._hooks = hooks;
    this._config = config;
    this._request = request;
    this._scopedCSS = scopedCSS;
    this._hooks.addHook('loadStyle', new AsyncSeriesHook());
  }

  public apply(): void {
    this._scopedCSS.apply();
    this._hooks.loadStyle.tap(VERSEA_PLUGIN_SANDBOX_TAP, async ({ app, style }) => {
      await this._ensureStyleCode(style, app);
      this._appendStyleElement(style, app);
    });
  }

  public async load({ app }: LoadSourceHookContext): Promise<void> {
    const deferred = new Deferred<void>();
    this._styleDeferred.set(app, deferred);

    if (app.styles) {
      void Promise.all(app.styles.map(async (style) => this._hooks.loadStyle.call({ app, style })))
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
    this._styleDeferred.delete(app);
    app.styles = undefined;
  }

  /** 设置 style.code */
  protected async _ensureStyleCode(style: SourceStyle, app: IApp): Promise<void> {
    const { src } = style;

    // 没有资源文件链接，直接返回
    if (!src) {
      return;
    }

    // 全局资源文件链接
    if (this._globalStyles.has(src)) {
      style.code = this._globalStyles.get(src);
      return;
    }

    // 拉取资源
    style.code = await this._fetchStyleCode(style, app);
  }

  /** 获取 style 资源内容 */
  protected async _fetchStyleCode(style: SourceStyle, app: IApp): Promise<string> {
    const { src, isGlobal } = style;

    try {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const code = await this._request.fetch(src!, app);
      if (isGlobal) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this._globalStyles.set(src!, code);
      }
      return code;
    } catch (error) {
      // CSS 文件获取失败，不影响主流程执行
      logError(error, app.name);
      return '';
    }
  }

  protected _appendStyleElement(style: SourceStyle, app: IApp): void {
    const { src, code, placeholder } = style;
    const { rawCreateElement, rawGetElementsByTagName, rawAppendChild, rawReplaceChild } = globalEnv;

    const styleLink = rawCreateElement.call(document, 'style') as HTMLStyleElement;
    styleLink.textContent = code ?? '';
    styleLink.__VERSEA_APP_LINK_PATH__ = src;
    styleLink.setAttribute('data-origin-href', src ?? '');

    this._scopeCSS(styleLink, style, app);

    if (placeholder?.parentNode) {
      rawReplaceChild.call(placeholder.parentNode, styleLink, placeholder);
      return;
    }

    let head: Element | null = rawGetElementsByTagName.call(document, 'head')[0];
    if (app.container) {
      head = globalEnv.rawQuerySelector.call(app.container, 'versea-app-head');
      if (!head) {
        throw new VerseaError('Can not find "versea-app-head" element');
      }
    }

    rawAppendChild.call(head, styleLink);
  }

  /** 给样式表增加前缀 */
  protected _scopeCSS(styleLink: HTMLStyleElement, style: SourceStyle, app: IApp): void {
    const scopedCSS = (app as IInternalApp)._scopedCSS ?? this._config.scopedCSS;
    if (scopedCSS) {
      this._scopedCSS.process(styleLink, style, app);
    }
  }
}
