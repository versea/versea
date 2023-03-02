import { provide } from '@versea/core';
import { logWarn } from '@versea/shared';
import { inject } from 'inversify';

import { ICurrentApp } from '../../current-app/interface';
import { globalEnv } from '../../global-env';
import { isBoundFunction } from '../../utils';
import { VerseaAppEventListener } from '../sandbox/types';
import { IDocumentEffect } from './interface';

export * from './interface';

@provide(IDocumentEffect)
export class DocumentEffect implements IDocumentEffect {
  public readonly clickHandlerMap = new Map<string, ((this: GlobalEventHandlers, ev: MouseEvent) => unknown) | null>();

  public readonly eventListenerMap = new Map<string, Map<string, Set<VerseaAppEventListener>>>();

  protected readonly _currentApp: ICurrentApp;

  protected _hasOverwriteDocumentOnClick = false;

  constructor(@inject(ICurrentApp) currentApp: ICurrentApp) {
    this._currentApp = currentApp;
  }

  public effectEvent(): void {
    const { _currentApp: currentApp, eventListenerMap } = this;

    if (!this._hasOverwriteDocumentOnClick) {
      this._overwriteDocumentOnClick();
    }

    document.addEventListener = function (
      type: keyof DocumentEventMap,
      listener: VerseaAppEventListener,
      options?: AddEventListenerOptions | boolean,
    ): void {
      const appName = currentApp.getName();
      if (appName && !isBoundFunction(listener)) {
        const appListenersMap = eventListenerMap.get(appName);
        if (appListenersMap) {
          const appListenerList = appListenersMap.get(type);
          if (appListenerList) {
            appListenerList.add(listener);
          } else {
            appListenersMap.set(type, new Set([listener]));
          }
        } else {
          eventListenerMap.set(appName, new Map([[type, new Set([listener])]]));
        }
        if (listener) {
          listener.__VERSEA_APP_LISTENER_OPTIONS__ = options;
        }
      }
      globalEnv.rawDocumentAddEventListener.call(globalEnv.rawDocument, type, listener, options);
    };

    document.removeEventListener = function (
      type: string,
      listener: VerseaAppEventListener,
      options?: AddEventListenerOptions | boolean,
    ): void {
      const appName = currentApp.getName();
      if (appName && !isBoundFunction(listener)) {
        const appListenersMap = eventListenerMap.get(appName);
        if (appListenersMap) {
          const appListenerList = appListenersMap.get(type);
          if (appListenerList?.size && appListenerList.has(listener)) {
            appListenerList.delete(listener);
          }
        }
      }
      globalEnv.rawDocumentRemoveEventListener.call(globalEnv.rawDocument, type, listener, options);
    };
  }

  public restoreEvent(): void {
    document.addEventListener = globalEnv.rawDocumentAddEventListener;
    document.removeEventListener = globalEnv.rawDocumentRemoveEventListener;
  }

  /**
   * 重写 `document.onclick`
   * @description 将 `document.onclick` 改成一个 listener 数组，每个应用都可以执行一次
   */
  protected _overwriteDocumentOnClick(): void {
    if (this._hasOverwriteDocumentOnClick) return;
    this._hasOverwriteDocumentOnClick = true;

    if (Object.getOwnPropertyDescriptor(document, 'onclick')) {
      logWarn('Can not redefine document property onclick');
      return;
    }

    let hasDocumentOnClickInitial = false;
    const { _currentApp: currentApp, clickHandlerMap } = this;

    function onClickHandler(e: Event): void {
      clickHandlerMap.forEach((fn) => {
        if (typeof fn === 'function') {
          fn.call(document, e as MouseEvent);
        }
      });
    }

    // 暂存 `document.onclick`，之后重新设置 `document.onclick`
    const rawOnClick = document.onclick;
    document.onclick = null;

    Object.defineProperty(document, 'onclick', {
      configurable: true,
      enumerable: true,
      get() {
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
        return clickHandlerMap.get(currentApp.getName() || 'VERSEA_BASE_APP');
      },
      set(fn: GlobalEventHandlers['onclick']) {
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
        clickHandlerMap.set(currentApp.getName() || 'VERSEA_BASE_APP', fn);

        if (!hasDocumentOnClickInitial && typeof fn === 'function') {
          hasDocumentOnClickInitial = true;
          globalEnv.rawDocumentAddEventListener.call(globalEnv.rawDocument, 'click', onClickHandler, false);
        }
      },
    });

    if (rawOnClick) {
      document.onclick = rawOnClick;
    }
  }
}
