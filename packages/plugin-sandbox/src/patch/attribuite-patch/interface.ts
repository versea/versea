import { createServiceSymbol } from '@versea/core';

export const IAttributePatch = createServiceSymbol('IAttributePatch');

/** 重写 setAttribute */
export interface IAttributePatch {
  patch: () => void;

  restore: () => void;
}
