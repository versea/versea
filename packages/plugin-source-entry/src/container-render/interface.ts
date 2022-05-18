import { createServiceSymbol, IApp } from '@versea/core';

import { LoadAppHookContext, MountAppHookContext, UnmountAppHookContext } from '../plugin/interface';

export const IContainerRenderKey = createServiceSymbol('IContainerRender');

export interface IContainerRender {
  /** 生成容器元素 */
  createContainerElement: (app: IApp) => HTMLElement;

  /** 获取容器 ID */
  getWrapperId: (name: string) => string;

  /** 渲染容器内容 */
  renderContainer: (
    context: LoadAppHookContext | MountAppHookContext | UnmountAppHookContext,
    element?: HTMLElement | null,
  ) => boolean;
}
