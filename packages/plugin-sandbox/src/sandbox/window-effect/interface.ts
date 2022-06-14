import { createServiceSymbol } from '@versea/core';

import { TimerEventRecord, VerseaAppEventListener, VerseaAppWindow } from '../sandbox/types';

export const IWindowEffect = createServiceSymbol('IWindowEffect');

export interface IWindowEffect {
  /** 事件名和监听函数的 Map */
  readonly eventListenerMap: Map<string, Set<VerseaAppEventListener>>;

  /** `setInterval` 返回值和参数Map */
  readonly intervalIdMap: Map<number, TimerEventRecord>;

  /** `setTimeout` 返回值和参数Map */
  readonly timeoutIdMap: Map<number, TimerEventRecord>;
}

export interface WindowEffectOptions {
  proxyWindow: VerseaAppWindow;
}
