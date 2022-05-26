import { createServiceSymbol } from '@versea/core';

export const ILoadEventKey = createServiceSymbol('ILoadEvent');

export interface ILoadEvent {
  /** 触发资源加载成功事件 */
  dispatchOnLoadEvent: (element: HTMLLinkElement | HTMLScriptElement) => void;

  /** 触发资源加载错误事件 */
  dispatchOnErrorEvent: (element: HTMLLinkElement | HTMLScriptElement) => void;
}
