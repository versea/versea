/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/unbound-method */
import { isBrowser } from '@versea/shared';

import { ICurrentApp } from './current-app/service';
import { VerseaAppWindow } from './sandbox/sandbox/interface';

declare global {
  interface Window {
    _babelPolyfill?: boolean;
    __VERSEA_APP_PROXY_WINDOW__?: VerseaAppWindow;
  }

  interface Element {
    __VERSEA_APP_NAME__?: string | undefined;
  }

  interface HTMLStyleElement {
    __VERSEA_APP_LINK_PATH__?: string;
    __VERSEA_APP_HAS_SCOPED__?: boolean;
  }
}

interface GlobalEnv {
  rawSetAttribute: typeof Element.prototype.setAttribute;
  rawAppendChild: typeof Element.prototype.appendChild;
  rawInsertBefore: typeof Element.prototype.insertBefore;
  rawReplaceChild: typeof Element.prototype.replaceChild;
  rawRemoveChild: typeof Element.prototype.removeChild;
  rawAppend: typeof Element.prototype.append;
  rawPrepend: typeof Element.prototype.prepend;
  rawCloneNode: typeof Element.prototype.cloneNode;

  rawCreateElement: typeof Document.prototype.createElement;
  rawCreateElementNS: typeof Document.prototype.createElementNS;
  rawCreateDocumentFragment: typeof Document.prototype.createDocumentFragment;
  rawQuerySelector: typeof Document.prototype.querySelector;
  rawQuerySelectorAll: typeof Document.prototype.querySelectorAll;
  rawGetElementById: typeof Document.prototype.getElementById;
  rawGetElementsByClassName: typeof Document.prototype.getElementsByClassName;
  rawGetElementsByTagName: typeof Document.prototype.getElementsByTagName;
  rawGetElementsByName: typeof Document.prototype.getElementsByName;
  ImageProxy: typeof Image;

  rawWindow: Window;
  rawDocument: Document;
  supportModuleScript: boolean;

  rawWindowAddEventListener: typeof window.addEventListener;
  rawWindowRemoveEventListener: typeof window.removeEventListener;
  rawSetInterval: typeof window.setInterval;
  rawSetTimeout: typeof window.setTimeout;
  rawClearInterval: typeof window.clearInterval;
  rawClearTimeout: typeof window.clearTimeout;
  rawDocumentAddEventListener: typeof document.addEventListener;
  rawDocumentRemoveEventListener: typeof document.removeEventListener;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
let _currentApp: ICurrentApp | null = null;
export function bindCurrentApp(currentApp: ICurrentApp): void {
  _currentApp = currentApp;
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-implied-eval
const rawWindow: Window & typeof globalThis = Function('return window')();
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-implied-eval
const rawDocument: Document = Function('return document')();

function isSupportModuleScript(): boolean {
  const s = document.createElement('script');
  return 'noModule' in s;
}

export const globalEnv: GlobalEnv = {} as GlobalEnv;

if (isBrowser) {
  Object.assign(globalEnv, {
    rawSetAttribute: Element.prototype.setAttribute,
    rawAppendChild: Element.prototype.appendChild,
    rawInsertBefore: Element.prototype.insertBefore,
    rawReplaceChild: Element.prototype.replaceChild,
    rawRemoveChild: Element.prototype.removeChild,
    rawAppend: Element.prototype.append,
    rawPrepend: Element.prototype.prepend,
    rawCloneNode: Element.prototype.cloneNode,

    rawCreateElement: Document.prototype.createElement,
    rawCreateElementNS: Document.prototype.createElementNS,
    rawCreateDocumentFragment: Document.prototype.createDocumentFragment,
    rawQuerySelector: Document.prototype.querySelector,
    rawQuerySelectorAll: Document.prototype.querySelectorAll,
    rawGetElementById: Document.prototype.getElementById,
    rawGetElementsByClassName: Document.prototype.getElementsByClassName,
    rawGetElementsByTagName: Document.prototype.getElementsByTagName,
    rawGetElementsByName: Document.prototype.getElementsByName,
    ImageProxy: new Proxy(Image, {
      construct(Target, args: [number | undefined, number | undefined]): HTMLImageElement {
        const elementImage = new Target(...args);
        if (_currentApp) {
          elementImage.__VERSEA_APP_NAME__ = _currentApp.getName();
        }
        return elementImage;
      },
    }),

    // 全局通用变量
    rawWindow,
    rawDocument,
    supportModuleScript: isSupportModuleScript(),

    // 沙箱内代码执行可能产生的副作用
    rawWindowAddEventListener: rawWindow.addEventListener,
    rawWindowRemoveEventListener: rawWindow.removeEventListener,
    rawSetInterval: rawWindow.setInterval,
    rawSetTimeout: rawWindow.setTimeout,
    rawClearInterval: rawWindow.clearInterval,
    rawClearTimeout: rawWindow.clearTimeout,
    rawDocumentAddEventListener: rawDocument.addEventListener,
    rawDocumentRemoveEventListener: rawDocument.removeEventListener,
  });
}
