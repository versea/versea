import { createServiceSymbol, IApp } from '@versea/core';

import { MountAppHookContext, UnmountAppHookContext } from '../plugin/interface';

export const IContainerRenderer = createServiceSymbol('IContainerRenderer');

export interface IContainerRenderer {
  /** 生成容器元素 */
  createElement: (app: IApp) => Promise<HTMLElement>;

  /** 获取容器 ID */
  getWrapperId: (name: string) => string;

  /**
   * 渲染容器内容
   * @returns {boolean} 是否渲染成功
   */
  render: (context: MountAppHookContext | UnmountAppHookContext, element?: HTMLElement | null) => boolean;

  /** 查找 Dom 节点 */
  querySelector: (selector: string) => HTMLElement | null;
}
