import { AppConfig, AppHooks, createServiceSymbol } from '@versea/core';

export const IResourceLoaderKey = createServiceSymbol('IResourceLoader');

export interface IResourceLoader {
  /** 加载资源文件 */
  load: (config: AppConfig) => Promise<AppHooks>;

  isInlineCode: (code: string) => boolean;

  getInlineCode: (code: string) => string;

  evalCode: (src: string, code: string, global: unknown, strict: boolean) => void;
}
