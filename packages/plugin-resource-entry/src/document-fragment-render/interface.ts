import { AppConfig, createServiceSymbol, IApp } from '@versea/core';

export const IContainerRenderKey = createServiceSymbol('IContainerRender');

export interface IContainerRender {
  /** 生成容器元素 */
  createElement: (app: IApp, config: AppConfig) => HTMLElement;

  /** 获取容器 ID */
  getWrapperId: (name: string) => string;
}
