import { provide } from '@versea/core';
import { ExtensibleEntity } from '@versea/shared';

import { globalEnv } from '../../global-env';
import { VerseaAppWindow } from '../sandbox/interface';
import { TimerEventRecord, VerseaAppEventListener } from '../sandbox/types';
import { IWindowEffect, WindowEffectOptions } from './interface';

export * from './interface';

@provide(IWindowEffect, 'Constructor')
export class WindowEffect extends ExtensibleEntity implements IWindowEffect {
  public readonly eventListenerMap = new Map<string, Set<VerseaAppEventListener>>();

  public readonly intervalIdMap = new Map<number, TimerEventRecord>();

  public readonly timeoutIdMap = new Map<number, TimerEventRecord>();

  protected _proxyWindow: VerseaAppWindow;

  constructor(options: WindowEffectOptions) {
    super(options);
    this._proxyWindow = options.proxyWindow;

    // 执行重写副作用函数
    this._effect();
  }

  /** 重写 AppWindow 上具有副作用的函数 */
  public _effect(): void {
    const { _proxyWindow: proxyWindow, eventListenerMap, intervalIdMap, timeoutIdMap } = this;
    const {
      rawWindow,
      rawWindowAddEventListener,
      rawWindowRemoveEventListener,
      rawSetInterval,
      rawSetTimeout,
      rawClearInterval,
      rawClearTimeout,
    } = globalEnv;

    proxyWindow.addEventListener = function (
      type: string,
      listener: VerseaAppEventListener,
      options?: AddEventListenerOptions | boolean,
    ): void {
      const listenerList = eventListenerMap.get(type);
      if (listenerList) {
        listenerList.add(listener);
      } else {
        eventListenerMap.set(type, new Set([listener]));
      }
      if (listener) {
        listener.__VERSEA_APP_LISTENER_OPTIONS__ = options;
      }
      rawWindowAddEventListener.call(rawWindow, type, listener, options);
    };

    proxyWindow.removeEventListener = function (
      type: string,
      listener: VerseaAppEventListener,
      options?: AddEventListenerOptions | boolean,
    ): void {
      const listenerList = eventListenerMap.get(type);
      if (listenerList?.size && listenerList.has(listener)) {
        listenerList.delete(listener);
      }
      rawWindowRemoveEventListener.call(rawWindow, type, listener, options);
    };

    proxyWindow.setInterval = function (handler: TimerHandler, timeout?: number, ...args: unknown[]): number {
      // @ts-expect-error 扩展操作符透传参数
      const intervalId = rawSetInterval.call(rawWindow, handler, timeout, ...args) as unknown as number;
      intervalIdMap.set(intervalId, { handler, timeout, args });
      return intervalId;
    };

    proxyWindow.setTimeout = function (handler: TimerHandler, timeout?: number, ...args: unknown[]): number {
      // @ts-expect-error 扩展操作符透传参数
      const timeoutId = rawSetTimeout.call(rawWindow, handler, timeout, ...args) as unknown as number;
      timeoutIdMap.set(timeoutId, { handler, timeout, args });
      return timeoutId;
    };

    proxyWindow.clearInterval = function (intervalId: number): void {
      intervalIdMap.delete(intervalId);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
      rawClearInterval.call(rawWindow, intervalId as any);
    };

    proxyWindow.clearTimeout = function (timeoutId: number): void {
      timeoutIdMap.delete(timeoutId);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
      rawClearTimeout.call(rawWindow, timeoutId as any);
    };
  }
}
