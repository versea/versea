import { createServiceSymbol } from '@versea/core';

export const ISandboxEffectKey = createServiceSymbol('ISandboxEffect');

export interface ISandboxEffect {
  /** 重写 Document 上的事件方法 */
  effectDocumentEvent: () => void;
}

export interface TimerEventRecord {
  handler: TimerHandler;
  timeout?: number;
  args: unknown[];
}
