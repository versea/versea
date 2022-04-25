import { AppConfig, createServiceSymbol } from '@versea/core';

export const IAppLoaderWriterKey = createServiceSymbol('IAppLoaderWriter');

export interface IAppLoaderWriter {
  /** 启动插件 */
  rewrite: (config: AppConfig) => void;
}
