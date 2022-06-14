import { createServiceSymbol, IApp } from '@versea/core';
import { LoadSourceHookContext, SourceScript } from '@versea/plugin-source-entry';
import { HookContext } from '@versea/tapable';

export const IScriptLoader = createServiceSymbol('IScriptLoader');

export interface IScriptLoader {
  /** 增加监听函数 */
  apply: () => void;

  /** 加载资源文件 */
  load: (context: LoadSourceHookContext) => Promise<void>;

  /** 等待加载资源文件完成  */
  waitLoaded: (app: IApp) => Promise<void>;

  /** 释放 app 加载的资源文件内容 */
  dispose: (app: IApp) => void;

  /** 尝试设置 script.code */
  ensureCode: (script: SourceScript, app: IApp) => Promise<void>;

  /** 执行资源文件 */
  exec: (app: IApp) => Promise<void>;

  /** 创建执行 RunScript 的元素 */
  createElementForRunScript: (script: SourceScript, app: IApp) => Comment | HTMLScriptElement;

  /** 动态添加脚本 */
  addDynamicScript: (script: SourceScript, app: IApp, originElement: HTMLScriptElement) => Comment | HTMLScriptElement;
}

export interface LoadScriptHookContext extends HookContext {
  app: IApp;

  /** script 文件描述 */
  script: SourceScript;
}

export interface RunScriptHookContext extends HookContext {
  app: IApp;

  /** 待执行代码 */
  code: string;

  /** script 文件描述 */
  script: SourceScript;

  /** 执行元素 */
  element: Comment | HTMLScriptElement;

  /** 将 element 添加到 body */
  appendToBody?: boolean;
}

export interface ProcessScripCodeHookContext extends HookContext {
  app: IApp;

  /** 待执行代码 */
  code: string;

  /** script 文件描述 */
  script: SourceScript;

  result: string;
}

export interface LoadDynamicScriptHookContext extends HookContext {
  app: IApp;

  /** 脚本文件描述 */
  script: SourceScript;

  /** 缓存的脚本文件描述 */
  cachedScript?: SourceScript;

  /** 原始 script 元素  */
  originElement: HTMLScriptElement;

  /** 替换的元素 */
  scriptElement: Comment | HTMLScriptElement;
}
