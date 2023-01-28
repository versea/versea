import { createServiceSymbol, IPlugin } from '@versea/core';

export const IPluginAutoWaitContainer = createServiceSymbol('IPluginAutoWaitContainer');

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IPluginAutoWaitContainer extends IPlugin {}

declare module '@versea/core' {
  interface IConfig {
    /** 等待容器渲染完成的超时时间 */
    autoWaitContainerTimeout?: number;
  }
}
