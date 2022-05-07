import { AppConfig, AppHooks, createServiceSymbol } from '@versea/core';

export const IResourceLoaderKey = createServiceSymbol('IResourceLoader');

export interface IResourceLoader {
  /** 加载资源文件 */
  load: (config: AppConfig) => Promise<AppHooks>;
}
