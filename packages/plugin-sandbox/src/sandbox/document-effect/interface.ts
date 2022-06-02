import { createServiceSymbol } from '@versea/core';

import { VerseaAppEventListener } from '../sandbox/types';

export const IDocumentEffect = createServiceSymbol('IDocumentEffect');

export interface IDocumentEffect {
  /** 应用名与 `document.onclick` 函数的 Map */
  readonly clickHandlerMap: Map<string, ((this: GlobalEventHandlers, ev: MouseEvent) => unknown) | null>;

  /** 应用名与 document 事件监听函数的 Map */
  readonly eventListenerMap: Map<string, Map<string, Set<VerseaAppEventListener>>>;

  /** 重写 Document 上的事件方法 */
  effectEvent: () => void;

  /** 重置 Document 上默认的事件方法 */
  restoreEvent: () => void;
}
