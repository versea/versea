import { createServiceSymbol, IApp } from '@versea/core';
import { LoadSourceHookContext } from '@versea/plugin-source-entry';

export const IStyleLoaderKey = createServiceSymbol('IStyleLoader');

export interface IStyleLoader {
  /** 加载资源文件 */
  load: (context: LoadSourceHookContext) => Promise<void>;

  /** 释放 app 加载的资源文件内容 */
  dispose: (app: IApp) => void;
}
