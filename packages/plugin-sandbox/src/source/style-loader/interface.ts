import { createServiceSymbol, IApp } from '@versea/core';
import { LoadSourceHookContext, SourceStyle } from '@versea/plugin-source-entry';
import { HookContext } from '@versea/tapable';

export const IStyleLoader = createServiceSymbol('IStyleLoader');

export interface IStyleLoader {
  /** 增加监听函数 */
  apply: () => void;

  /** 加载资源文件 */
  load: (context: LoadSourceHookContext) => Promise<void>;

  /** 释放 app 加载的资源文件内容 */
  dispose: (app: IApp) => void;
}

export interface LoadStyleHookContext extends HookContext {
  app: IApp;

  /** 样式文件描述 */
  style: SourceStyle;
}
