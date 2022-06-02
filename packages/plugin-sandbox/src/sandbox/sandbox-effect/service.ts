import { provide } from '@versea/core';
import { ExtensibleEntity } from '@versea/shared';

import { ICurrentApp } from '../../current-app/interface';
import { globalEnv } from '../../global-env';
import { IDocumentEffect } from '../document-effect/interface';
import { VerseaAppWindow } from '../sandbox/interface';
import { TimerEventRecord, VerseaAppEventListener } from '../sandbox/types';
import { IWindowEffect } from '../window-effect/interface';
import { ISandboxEffect, SandboxEffectDependencies, SandboxEffectOptions } from './interface';

export * from './interface';

@provide(ISandboxEffect, 'Constructor')
export class SandboxEffect extends ExtensibleEntity implements ISandboxEffect {
  protected _windowListenerMap = new Map<string, Set<VerseaAppEventListener>>();

  protected _documentListenerMap = new Map<string, Set<VerseaAppEventListener>>();

  protected _intervalIdMap = new Map<number, TimerEventRecord>();

  protected _timeoutIdMap = new Map<number, TimerEventRecord>();

  protected _documentClickHandler: unknown;

  protected _proxyWindow: VerseaAppWindow;

  protected _currentApp: ICurrentApp;

  protected _windowEffect: IWindowEffect;

  protected _documentEffect: IDocumentEffect;

  // eslint-disable-next-line @typescript-eslint/naming-convention
  constructor(options: SandboxEffectOptions, { currentApp, documentEffect, WindowEffect }: SandboxEffectDependencies) {
    super(options);
    this._proxyWindow = options.proxyWindow;

    // 绑定依赖
    this._currentApp = currentApp;
    this._documentEffect = documentEffect;

    // 生成 WindowEffect
    // @ts-expect-error 需要传入参数，但 inversify 这里的参数类型是 never
    this._windowEffect = new WindowEffect(options);
  }

  public recordEffect(): void {
    const appName = this._proxyWindow.__MICRO_APP_NAME__;
    const { eventListenerMap, intervalIdMap, timeoutIdMap } = this._windowEffect;
    const { eventListenerMap: documentEventListenerMap, clickHandlerMap: documentClickHandlerMap } =
      this._documentEffect;

    // 记录 AppWindow 上产生的副作用
    eventListenerMap.forEach((listenerList, type) => {
      if (listenerList.size) {
        this._windowListenerMap.set(type, new Set(listenerList));
      }
    });
    if (intervalIdMap.size) {
      this._intervalIdMap = new Map(intervalIdMap);
    }
    if (timeoutIdMap.size) {
      this._timeoutIdMap = new Map(timeoutIdMap);
    }

    // 记录 Document 上产生的副作用
    this._documentClickHandler = documentClickHandlerMap.get(appName);
    const documentAppListenersMap = documentEventListenerMap.get(appName);
    if (documentAppListenersMap) {
      documentAppListenersMap.forEach((listenerList, type) => {
        if (listenerList.size) {
          this._documentListenerMap.set(type, new Set(listenerList));
        }
      });
    }
  }

  public rebuildEffect(): void {
    const appName = this._proxyWindow.__MICRO_APP_NAME__;
    const {
      _windowListenerMap: windowListenerMap,
      _intervalIdMap: intervalIdMap,
      _timeoutIdMap: timeoutIdMap,
      _documentListenerMap: documentListenerMap,
      _documentClickHandler: documentClickHandler,
    } = this;

    // 重新生成 AppWindow 上的副作用
    windowListenerMap.forEach((listenerList, type) => {
      for (const listener of listenerList) {
        this._proxyWindow.addEventListener(type, listener, listener?.__VERSEA_APP_LISTENER_OPTIONS__);
      }
    });
    intervalIdMap.forEach((record) => {
      this._proxyWindow.setInterval(record.handler, record.timeout, ...record.args);
    });
    timeoutIdMap.forEach((record) => {
      this._proxyWindow.setTimeout(record.handler, record.timeout, ...record.args);
    });

    // 重新生成 Document 上的副作用
    if (documentClickHandler) {
      this._documentEffect.clickHandlerMap.set(
        appName,
        this._documentClickHandler as (this: GlobalEventHandlers, ev: MouseEvent) => unknown,
      );
    }

    this._currentApp.setName(appName);
    documentListenerMap.forEach((listenerList, type) => {
      for (const listener of listenerList) {
        document.addEventListener(type, listener, listener?.__VERSEA_APP_LISTENER_OPTIONS__);
      }
    });
    this._currentApp.setName();
  }

  public releaseEffect(): void {
    const appName = this._proxyWindow.__MICRO_APP_NAME__;
    const { eventListenerMap, intervalIdMap, timeoutIdMap } = this._windowEffect;
    const { eventListenerMap: documentEventListenerMap, clickHandlerMap: documentClickHandlerMap } =
      this._documentEffect;
    const {
      rawWindow,
      rawDocument,
      rawWindowRemoveEventListener,
      rawClearInterval,
      rawClearTimeout,
      rawDocumentRemoveEventListener,
    } = globalEnv;

    // 删除 AppWindow 上产生的副作用
    if (eventListenerMap.size) {
      eventListenerMap.forEach((listenerList, type) => {
        for (const listener of listenerList) {
          rawWindowRemoveEventListener.call(rawWindow, type, listener);
        }
      });
      eventListenerMap.clear();
    }
    if (intervalIdMap.size) {
      intervalIdMap.forEach((_, intervalId: number) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
        rawClearInterval.call(rawWindow, intervalId as any);
      });
      intervalIdMap.clear();
    }
    if (timeoutIdMap.size) {
      timeoutIdMap.forEach((_, timeoutId: number) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
        rawClearTimeout.call(rawWindow, timeoutId as any);
      });
      timeoutIdMap.clear();
    }

    // 删除 Document 上产生的副作用
    documentClickHandlerMap.delete(appName);
    const documentAppListenersMap = documentEventListenerMap.get(appName);
    if (documentAppListenersMap) {
      documentAppListenersMap.forEach((listenerList, type) => {
        for (const listener of listenerList) {
          rawDocumentRemoveEventListener.call(rawDocument, type, listener);
        }
      });
      documentAppListenersMap.clear();
    }
  }
}
