import { createServiceSymbol } from '@versea/core';

export const IElementPatch = createServiceSymbol('IElementPatch');

/** 重写 Element 和 Document 上的方法 */
export interface IElementPatch {
  patch: () => void;

  restore: () => void;
}
