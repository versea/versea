import { AppLifeCycles, AppProps, createServiceSymbol, IApp } from '@versea/core';
import { HookContext } from '@versea/tapable';

import { LoadAppHookContext, MountAppHookContext } from '../plugin/interface';

export const ISourceControllerKey = createServiceSymbol('ISourceController');

export interface ISourceController {
  /** 增加监听 */
  apply: () => void;

  /**
   * 加载资源文件
   * @description 加载资源文件，并存储文件内容
   */
  load: (context: LoadAppHookContext) => Promise<void>;

  /**
   * 执行资源文件
   * @description 执行存储的文件内容
   */
  exec: (context: LoadAppHookContext | MountAppHookContext) => Promise<AppLifeCycles>;
}

export interface LoadSourceHookContext extends HookContext {
  app: IApp;

  /** Load 参数 */
  props: AppProps;
}

export interface ExecSourceHookContext extends HookContext {
  app: IApp;

  /** Load 或 Mount 参数 */
  props: AppProps;

  /** 执行 scripts 之后返回的生命周期函数 */
  result?: AppLifeCycles;
}
