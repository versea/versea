import { IApp, IAppService, IHooks, provide } from '@versea/core';
import { completionPath, IInternalApp, SourceScript, SourceStyle } from '@versea/plugin-source-entry';
import { AsyncSeriesHook, Tap } from '@versea/tapable';
import { inject } from 'inversify';

import { PLUGIN_SANDBOX_TAP } from '../constants';
import { ICurrentApp } from '../current-app/interface';
import { globalEnv } from '../global-env';
import { IScriptLoader, RunScriptHookContext } from '../source/script-loader/interface';
import { IStyleLoader } from '../source/style-loader/interface';
import { IElementPatch } from './interface';

export * from './interface';

function isUniqueElement(key: string): boolean {
  return /^body$/i.test(key) || /^head$/i.test(key) || /^html$/i.test(key);
}

function isInvalidQuerySelectorKey(key: string): boolean {
  return !key || /(^\d)|([^\w\d-_\u4e00-\u9fa5])/gi.test(key);
}

@provide(IElementPatch)
export class ElementPatch implements IElementPatch {
  /** 新增的节点和替换的节点的 Map */
  protected _dynamicElement = new WeakMap<Node, Comment | Element>();

  protected _appService: IAppService;

  protected _hooks: IHooks;

  protected _currentApp: ICurrentApp;

  protected _styleLoader: IStyleLoader;

  protected _scriptLoader: IScriptLoader;

  constructor(
    @inject(IAppService) appService: IAppService,
    @inject(IHooks) hooks: IHooks,
    @inject(ICurrentApp) currentApp: ICurrentApp,
    @inject(IStyleLoader) styleLoader: IStyleLoader,
    @inject(IScriptLoader) scriptLoader: IScriptLoader,
  ) {
    this._appService = appService;
    this._hooks = hooks;
    this._currentApp = currentApp;
    this._styleLoader = styleLoader;
    this._scriptLoader = scriptLoader;
  }

  public patch(): void {
    this._patchDocument();
    this._patchElement();
  }

  public restore(): void {
    this._currentApp.setName();

    Document.prototype.createElement = globalEnv.rawCreateElement;
    Document.prototype.createElementNS = globalEnv.rawCreateElementNS;
    Document.prototype.createDocumentFragment = globalEnv.rawCreateDocumentFragment;
    Document.prototype.querySelector = globalEnv.rawQuerySelector;
    Document.prototype.querySelectorAll = globalEnv.rawQuerySelectorAll;
    Document.prototype.getElementById = globalEnv.rawGetElementById;
    Document.prototype.getElementsByClassName = globalEnv.rawGetElementsByClassName;
    Document.prototype.getElementsByTagName = globalEnv.rawGetElementsByTagName;
    Document.prototype.getElementsByName = globalEnv.rawGetElementsByName;

    Element.prototype.appendChild = globalEnv.rawAppendChild;
    Element.prototype.insertBefore = globalEnv.rawInsertBefore;
    Element.prototype.replaceChild = globalEnv.rawReplaceChild;
    Element.prototype.removeChild = globalEnv.rawRemoveChild;
    Element.prototype.append = globalEnv.rawAppend;
    Element.prototype.prepend = globalEnv.rawPrepend;
    Element.prototype.cloneNode = globalEnv.rawCloneNode;
  }

  protected _patchDocument(): void {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;

    const { rawDocument } = globalEnv;

    Document.prototype.createElement = function createElement(
      tagName: string,
      options?: ElementCreationOptions,
    ): HTMLElement {
      const element = globalEnv.rawCreateElement.call(this, tagName, options);
      return self._markElement(element);
    };

    // @ts-expect-error 这里具有多态，暂不处理复杂的类型声明
    Document.prototype.createElementNS = function createElementNS(
      namespaceURI: string,
      name: string,
      options?: ElementCreationOptions | string,
    ): Element {
      const element = globalEnv.rawCreateElementNS.call(this, namespaceURI, name, options);
      return self._markElement(element);
    };

    Document.prototype.createDocumentFragment = function createDocumentFragment(): DocumentFragment {
      const element = globalEnv.rawCreateDocumentFragment.call(this);
      return self._markElement(element as unknown as Element) as unknown as DocumentFragment;
    };

    function querySelector(this: Document, selectors: string): unknown {
      const appName = self._currentApp.getName();
      if (!appName || !selectors || isUniqueElement(selectors) || rawDocument !== this) {
        return globalEnv.rawQuerySelector.call(this, selectors);
      }
      return self._appService.getApp(appName)?.container?.querySelector(selectors) ?? null;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function querySelectorAll(this: Document, selectors: string): any {
      const appName = self._currentApp.getName();
      if (!appName || !selectors || isUniqueElement(selectors) || rawDocument !== this) {
        return globalEnv.rawQuerySelectorAll.call(this, selectors);
      }
      return self._appService.getApp(appName)?.container?.querySelectorAll(selectors) ?? [];
    }

    Document.prototype.querySelector = querySelector;
    Document.prototype.querySelectorAll = querySelectorAll;

    Document.prototype.getElementById = function getElementById(key: string): HTMLElement | null {
      const appName = self._currentApp.getName();
      if (!appName || isInvalidQuerySelectorKey(key)) {
        return globalEnv.rawGetElementById.call(this, key);
      }

      try {
        return querySelector.call(this, `#${key}`) as HTMLElement | null;
      } catch {
        return globalEnv.rawGetElementById.call(this, key);
      }
    };

    Document.prototype.getElementsByClassName = function getElementsByClassName(
      key: string,
    ): HTMLCollectionOf<Element> {
      const appName = self._currentApp.getName();
      if (!appName || isInvalidQuerySelectorKey(key)) {
        return globalEnv.rawGetElementsByClassName.call(this, key);
      }

      try {
        return querySelectorAll.call(this, `.${key}`) as unknown as HTMLCollectionOf<Element>;
      } catch {
        return globalEnv.rawGetElementsByClassName.call(this, key);
      }
    };

    Document.prototype.getElementsByTagName = function getElementsByTagName(key: string): HTMLCollectionOf<Element> {
      const appName = self._currentApp.getName();
      if (
        !appName ||
        isUniqueElement(key) ||
        isInvalidQuerySelectorKey(key) ||
        (!(self._appService.getApp(appName) as IInternalApp)?._inlineScript && /^script$/i.test(key))
      ) {
        return globalEnv.rawGetElementsByTagName.call(this, key);
      }

      try {
        return querySelectorAll.call(this, key) as HTMLCollectionOf<Element>;
      } catch {
        return globalEnv.rawGetElementsByTagName.call(this, key);
      }
    };

    Document.prototype.getElementsByName = function getElementsByName(key: string): NodeListOf<HTMLElement> {
      const appName = self._currentApp.getName();
      if (!appName || isInvalidQuerySelectorKey(key)) {
        return globalEnv.rawGetElementsByName.call(this, key);
      }

      try {
        return querySelectorAll.call(this, `[name=${key}]`) as NodeListOf<HTMLElement>;
      } catch {
        return globalEnv.rawGetElementsByName.call(this, key);
      }
    };
  }

  protected _patchElement(): void {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;

    Element.prototype.appendChild = function appendChild<T extends Node>(newChild: T): T {
      return self._commonElementHandler(this, newChild, null, globalEnv.rawAppendChild) as T;
    };

    Element.prototype.insertBefore = function insertBefore<T extends Node>(newChild: T, refChild: Node | null): T {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
      return self._commonElementHandler(this, newChild, refChild, globalEnv.rawInsertBefore as any) as T;
    };

    Element.prototype.replaceChild = function replaceChild<T extends Node>(newChild: Node, oldChild: T): T {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
      return self._commonElementHandler(this, newChild, oldChild, globalEnv.rawReplaceChild as any) as T;
    };

    Element.prototype.append = function append(...nodes: (Node | string)[]): void {
      let i = 0;
      const length = nodes.length;
      while (i < length) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
        self._commonElementHandler(this, nodes[i] as Node, null, globalEnv.rawAppend as any);
        i++;
      }
    };

    Element.prototype.prepend = function prepend(...nodes: (Node | string)[]): void {
      let i = nodes.length;
      while (i > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
        self._commonElementHandler(this, nodes[i - 1] as Node, null, globalEnv.rawPrepend as any);
        i--;
      }
    };

    Element.prototype.removeChild = function removeChild<T extends Node>(child: T): T {
      if (child?.__VERSEA_APP_NAME__) {
        const app = self._appService.getApp(child.__VERSEA_APP_NAME__);
        if (app?.container) {
          return self._invokeMethod(app, globalEnv.rawRemoveChild, this, self._getMappingElement(child)) as T;
        }
      }

      return globalEnv.rawRemoveChild.call(this, child) as T;
    };

    Element.prototype.cloneNode = function cloneNode(deep?: boolean): Node {
      const clonedNode = globalEnv.rawCloneNode.call(this, deep);
      if (this.__VERSEA_APP_NAME__) {
        clonedNode.__VERSEA_APP_NAME__ = this.__VERSEA_APP_NAME__;
      }
      return clonedNode;
    };
  }

  /** Mark the newly created element in the versea application */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  protected _markElement<T extends Element>(element: T): T {
    const appName = this._currentApp.getName();
    if (appName) {
      element.__VERSEA_APP_NAME__ = appName;
    }
    return element;
  }

  protected _commonElementHandler(
    parent: Node,
    newChild: Node,
    passiveChild: Node | null,
    // eslint-disable-next-line @typescript-eslint/ban-types
    rawMethod: (newChild: Node, passiveChild?: Node | null) => Node,
  ): Node {
    // 处理具有 __VERSEA_APP_NAME__ 的 Element，被标记元素可能特殊处理，如替换元素
    if (newChild?.__VERSEA_APP_NAME__) {
      const app = this._appService.getApp(newChild.__VERSEA_APP_NAME__);
      if (app?.container) {
        return this._invokeMethod(
          app,
          rawMethod,
          parent,
          this._handleNewNode(newChild, app),
          passiveChild && this._getMappingElement(passiveChild),
        );
      }

      if (rawMethod === globalEnv.rawAppend || rawMethod === globalEnv.rawPrepend) {
        return rawMethod.call(parent, newChild);
      }

      return rawMethod.call(parent, newChild, passiveChild);
    }

    // 处理没有 __VERSEA_APP_NAME__ 的 Element，不被标记的元素只能放在正确的节点位置
    if (rawMethod === globalEnv.rawAppend || rawMethod === globalEnv.rawPrepend) {
      const appName = this._currentApp.getName();
      if (!(newChild instanceof Node) && appName) {
        const app = this._appService.getApp(appName);
        if (app?.container) {
          if (parent === document.head) {
            return rawMethod.call(app.container.querySelector('versea-app-head'), newChild);
          } else if (parent === document.body) {
            return rawMethod.call(app.container.querySelector('versea-app-body'), newChild);
          }
        }
      }
      return rawMethod.call(parent, newChild);
    }

    return rawMethod.call(parent, newChild, passiveChild);
  }

  protected _invokeMethod(
    app: IApp,
    rawMethod: (newChild: Node, passiveChild?: Node | null) => Node,
    parent: Node,
    targetChild: Node,
    passiveChild?: Node | null,
  ): Node {
    if (parent === document.head) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const verseaAppHead = app.container!.querySelector('versea-app-head')!;
      return this._invokeUniqueElementMethod(rawMethod, parent, verseaAppHead, targetChild, passiveChild);
    }

    if (parent === document.body) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const verseaAppBody = app.container!.querySelector('versea-app-body')!;
      return this._invokeUniqueElementMethod(rawMethod, parent, verseaAppBody, targetChild, passiveChild);
    }

    if (rawMethod === globalEnv.rawAppend || rawMethod === globalEnv.rawPrepend) {
      return rawMethod.call(parent, targetChild);
    }

    return rawMethod.call(parent, targetChild, passiveChild);
  }

  protected _invokeUniqueElementMethod(
    rawMethod: (newChild: Node, passiveChild?: Node | null) => Node,
    originParent: Node,
    parent: Node,
    targetChild: Node,
    passiveChild?: Node | null,
  ): Node {
    if (passiveChild && !parent.contains(passiveChild)) {
      return globalEnv.rawAppendChild.call(parent, targetChild);
    }

    if (rawMethod === globalEnv.rawRemoveChild && !parent.contains(targetChild)) {
      if (originParent.contains(targetChild)) {
        return rawMethod.call(originParent, targetChild);
      }

      return targetChild;
    }

    if (rawMethod === globalEnv.rawAppend || rawMethod === globalEnv.rawPrepend) {
      return rawMethod.call(parent, targetChild);
    }

    return rawMethod.call(parent, targetChild, passiveChild);
  }

  protected _handleNewNode(node: Node, app: IApp): Node {
    if (node instanceof HTMLStyleElement) {
      return this._handleNewStyleElement(node, app);
    }

    if (node instanceof HTMLLinkElement) {
      return this._handleNewLinkElement(node, app);
    }

    if (node instanceof HTMLScriptElement) {
      return this._handleNewScriptElement(node, app);
    }

    return node;
  }

  protected _handleNewStyleElement(element: HTMLStyleElement, app: IApp): Node {
    if (element.hasAttribute('exclude')) {
      const replaceComment = document.createComment('style element with exclude attribute ignored by versea-app');
      this._dynamicElement.set(element, replaceComment);
      return replaceComment;
    }

    if (element.hasAttribute('ignore')) {
      return element;
    }

    this._styleLoader.scopeCSS(element, {}, app);
    return element;
  }

  protected _handleNewLinkElement(element: HTMLLinkElement, app: IApp): Node {
    if (element.hasAttribute('exclude')) {
      const linkReplaceComment = document.createComment('link element with exclude attribute ignored by versea-app');
      this._dynamicElement.set(element, linkReplaceComment);
      return linkReplaceComment;
    }

    if (element.hasAttribute('ignore')) {
      return element;
    }

    const rel = element.getAttribute('rel');
    const href = element.getAttribute('href');
    // 处理 link 的样式
    if (rel === 'stylesheet' && href) {
      const style: SourceStyle = {
        src: completionPath(href, app.assetsPublicPath),
        isGlobal: element.hasAttribute('global'),
      };

      const styleElement = globalEnv.rawCreateElement.call(document, 'style') as HTMLStyleElement;
      styleElement.__VERSEA_APP_LINK_PATH__ = style.src;

      this._styleLoader.addDynamicStyle(style, app, element, styleElement);
      this._dynamicElement.set(element, styleElement);
      return styleElement;
    }

    // 处理 link 的其他需要忽略的标签
    if (rel && ['prefetch', 'preload', 'prerender', 'icon', 'apple-touch-icon'].includes(rel)) {
      const comment = document.createComment(
        `link element with rel=${rel}${href ? ` & href=${href}` : ''} removed by versea-app`,
      );
      this._dynamicElement.set(element, comment);
      return comment;
    }

    if (href) {
      element.setAttribute('href', completionPath(href, app.assetsPublicPath));
    }

    return element;
  }

  protected _handleNewScriptElement(element: HTMLScriptElement, app: IApp): Node {
    const { supportModuleScript: supportModule } = globalEnv;
    let replaceComment: Comment | null = null;
    if (element.hasAttribute('exclude')) {
      replaceComment = document.createComment('script element with exclude attribute removed by versea-app');
    } else if ((supportModule && element.noModule) || (!supportModule && element.type === 'module')) {
      replaceComment = document.createComment(
        `${element.noModule ? 'noModule' : 'module'} script ignored by versea-app`,
      );
    }

    if (replaceComment) {
      this._dynamicElement.set(element, replaceComment);
      return replaceComment;
    }

    const types = ['text/javascript', 'text/ecmascript', 'application/javascript', 'application/ecmascript', 'module'];
    if ((element.type && !types.includes(element.type)) || element.hasAttribute('ignore')) {
      return element;
    }

    const script: SourceScript = {
      async: element.hasAttribute('async'),
      module: element.type === 'module',
    };
    if (element.src) {
      // remote script
      script.src = completionPath(element.src, app.assetsPublicPath);
      script.isGlobal = element.hasAttribute('global');
      const replaceElement = this._scriptLoader.addDynamicScript(script, app, element);
      this._dynamicElement.set(element, replaceElement);
      return replaceElement;
    }

    if (element.textContent) {
      // inline script
      script.code = element.textContent;
      const replaceElement = this._scriptLoader.createElementForRunScript(script, app);
      const context = { script, app, code: script.code, element: replaceElement };
      this._hooks.beforeRunDynamicInlineScript.call(context);
      this._runDynamicInlineScript({ ...context });
      this._dynamicElement.set(element, replaceElement);
      return replaceElement;
    }

    return element;
  }

  protected _runDynamicInlineScript(context: RunScriptHookContext): void {
    // InlineScript 必须保证默认监听同步执行，因此需要忽略 runScript 默认监听 PLUGIN_SANDBOX_TAP 之前的监听
    const runScriptHook = this._hooks.runScript;
    const taps = (
      runScriptHook as AsyncSeriesHook<RunScriptHookContext> & { _taps: Tap<RunScriptHookContext, Promise<void>>[] }
    )._taps;
    const ignoreTap: string[] = [];
    for (const tap of taps) {
      if (tap.name !== PLUGIN_SANDBOX_TAP) {
        ignoreTap.push(tap.name);
      } else {
        break;
      }
    }
    context.ignoreTap = ignoreTap;
    void runScriptHook.call(context);
  }

  protected _getMappingElement(node: Node): Node {
    return this._dynamicElement.get(node) ?? node;
  }
}
