import { createServiceSymbol, IApp } from '@versea/core';

import { LoadAppHookContext, MountAppHookContext, UnmountAppHookContext } from '../plugin/interface';

export const IContainerRendererKey = createServiceSymbol('IContainerRenderer');

export interface IContainerRenderer {
  /** 生成容器元素 */
  createContainerElement: (app: IApp) => HTMLElement;

  /** 获取容器 ID */
  getWrapperId: (name: string) => string;

  /**
   * 渲染容器内容
   * @returns {boolean} 是否渲染成功
   */
  renderContainer: (
    context: LoadAppHookContext | MountAppHookContext | UnmountAppHookContext,
    element?: HTMLElement | null,
  ) => boolean;
}
