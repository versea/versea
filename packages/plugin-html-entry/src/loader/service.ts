/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { IApp, provide } from '@versea/core';
import { IInternalApp, IRequest, SourceScript, SourceStyle, completionPath } from '@versea/plugin-source-entry';
import { logError } from '@versea/shared';
import { inject } from 'inversify';

import { isImageElement, isLinkElement, isScriptElement, isStyleElement, supportModuleScript } from '../utils';
import { IHtmlLoader } from './interface';

export * from './interface';

@provide(IHtmlLoader)
export class HtmlLoader implements IHtmlLoader {
  protected _request: IRequest;

  constructor(@inject(IRequest) request: IRequest) {
    this._request = request;
  }

  public load(app: IApp): void {
    const promise = this._request.fetch(app.entry!, app, { cache: 'no-cache' });
    (app as IInternalApp)._documentFragment = promise;

    promise
      .then((htmlStr) => {
        (app as IInternalApp)._documentFragment = htmlStr;
      })
      .catch((error) => {
        logError(error, app.name);
        (app as IInternalApp)._documentFragment = '';
      });
  }

  public extractSourceDom(app: IApp): void {
    if (!app.container) {
      return;
    }

    if (!app.scripts) {
      app.scripts = [];
    }

    if (!app.styles) {
      app.styles = [];
    }

    this._flatChildren(app.container, app);
  }

  protected _flatChildren(parent: HTMLElement, app: IApp): void {
    const children = Array.from(parent.children);

    if (children.length) {
      children.forEach((child) => {
        this._flatChildren(child as HTMLElement, app);
      });
    }

    for (const dom of children) {
      if (isLinkElement(dom)) {
        if (dom.hasAttribute('exclude')) {
          parent.replaceChild(document.createComment('link element with exclude attribute ignored by versea'), dom);
        } else if (!dom.hasAttribute('ignore')) {
          this._extractLinkFromHtml(dom, parent, app);
        } else if (dom.hasAttribute('href')) {
          dom.setAttribute('href', completionPath(dom.getAttribute('href')!, app.assetsPublicPath));
        }
      } else if (isStyleElement(dom)) {
        if (dom.hasAttribute('exclude')) {
          parent.replaceChild(document.createComment('style element with exclude attribute ignored by versea'), dom);
        } else if (!dom.hasAttribute('ignore')) {
          this._extractStyleFromHtml(dom, app);
        }
      } else if (isScriptElement(dom)) {
        this._extractScriptFromHtml(dom, parent, app);
      } else if (isImageElement(dom) && dom.hasAttribute('src')) {
        dom.setAttribute('src', completionPath(dom.getAttribute('src')!, app.assetsPublicPath));
      }
    }
  }

  protected _extractLinkFromHtml(link: HTMLLinkElement, parent: Node, app: IApp): void {
    const rel = link.getAttribute('rel');
    const href = link.getAttribute('href');
    let replaceComment: Comment | null = null;
    if (rel === 'stylesheet' && href) {
      replaceComment = document.createComment(`link element with href=${href} move to micro-app-head as style element`);
      app.styles!.push({
        src: href,
        placeholder: replaceComment,
        ignore: link.hasAttribute('ignore'),
        isGlobal: link.hasAttribute('global'),
      });
    } else if (rel && ['prefetch', 'preload', 'prerender', 'icon', 'apple-touch-icon'].includes(rel)) {
      parent.removeChild(link);
    } else if (href) {
      link.setAttribute('href', completionPath(href, app.entry));
    }

    if (replaceComment) {
      parent.replaceChild(replaceComment, link);
    }
  }

  protected _extractStyleFromHtml(styleElement: HTMLStyleElement, app: IApp): void {
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    const styleId = `style-${Math.random().toString(36).substr(2, 15)}`;
    const replaceComment = document.createComment(`style element with id=${styleId} extract by versea`);

    app.styles!.push({
      code: styleElement.textContent ?? '',
      placeholder: replaceComment,
      ignore: styleElement.hasAttribute('ignore'),
      styleId,
    } as SourceStyle);
  }

  protected _extractScriptFromHtml(scriptElement: HTMLScriptElement, parent: Node, app: IApp): void {
    let replaceComment: Comment | null = null;
    const src: string | null = scriptElement.getAttribute('src');
    const types = ['text/javascript', 'text/ecmascript', 'application/javascript', 'application/ecmascript', 'module'];

    if ((scriptElement.type && !types.includes(scriptElement.type)) || scriptElement.hasAttribute('ignore')) {
      return;
    }

    if (scriptElement.hasAttribute('exclude')) {
      replaceComment = document.createComment('script element with exclude attribute removed by versea');
    } else if (
      (supportModuleScript && scriptElement.noModule) ||
      (!supportModuleScript && scriptElement.type === 'module')
    ) {
      replaceComment = document.createComment(
        `${scriptElement.noModule ? 'noModule' : 'module'} script ignored by versea`,
      );
    } else if (src) {
      app.scripts!.push({
        src,
        async: scriptElement.hasAttribute('async'),
        module: scriptElement.type === 'module',
        ignore: scriptElement.hasAttribute('ignore'),
        isGlobal: scriptElement.hasAttribute('global'),
      });
      replaceComment = document.createComment(`script with src='${src}' extract by versea`);
    } else if (scriptElement.textContent) {
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      const scriptId = `script-${Math.random().toString(36).substr(2, 15)}`;
      replaceComment = document.createComment(`script with id=${scriptId} extract by versea`);
      app.scripts!.push({
        code: scriptElement.textContent,
        module: scriptElement.type === 'module',
        ignore: scriptElement.hasAttribute('ignore'),
        scriptId,
      } as SourceScript);
    } else {
      replaceComment = document.createComment('script element removed by versea');
    }

    if (replaceComment) {
      parent.replaceChild(replaceComment, scriptElement);
    }
  }
}
