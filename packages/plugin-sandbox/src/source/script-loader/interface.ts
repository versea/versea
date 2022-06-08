import { createServiceSymbol, IApp } from '@versea/core';
import { LoadSourceHookContext, SourceScript } from '@versea/plugin-source-entry';
import { HookContext } from '@versea/tapable';

export const IScriptLoader = createServiceSymbol('IScriptLoader');

export interface IScriptLoader {
  /** 增加监听函数 */
  apply: () => void;

  /** 加载资源文件 */
  load: (context: LoadSourceHookContext) => Promise<void>;

  /** 释放 app 加载的资源文件内容 */
  dispose: (app: IApp) => void;

  /** 尝试设置 script.code */
  ensureScriptCode: (script: SourceScript, app: IApp) => Promise<void>;

  /** 执行资源文件 */
  execScripts: (app: IApp) => Promise<void>;

  /** 执行单个资源文件 */
  runScript: (code: string, script: SourceScript, app: IApp) => Promise<void>;
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
}

export interface ProcessScripCodeHookContext extends HookContext {
  app: IApp;

  /** 待执行代码 */
  code: string;

  /** script 文件描述 */
  script: SourceScript;

  result: string;
}
