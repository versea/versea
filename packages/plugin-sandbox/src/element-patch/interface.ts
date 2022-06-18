import { createServiceSymbol } from '@versea/core';

export const IElementPatch = createServiceSymbol('IElementPatch');

/**
 * 拦截所有元素增删操作
 * @description 当增加的元素涉及资源加载时，应该触发 Sandbox 内部的资源加载流程，而不是浏览器默认的加载方式。
 */
export interface IElementPatch {
  patch: () => void;

  restore: () => void;
}
