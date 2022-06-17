import { AppLifeCycles, AppProps, createServiceSymbol, IApp } from '@versea/core';
import { HookContext } from '@versea/tapable';

import { LoadAppHookContext, MountAppHookContext, SourceScript, SourceStyle } from '../plugin/interface';

export const ISourceController = createServiceSymbol('ISourceController');

export interface ISourceController {
  /** 增加监听函数 */
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
  exec: (context: MountAppHookContext) => Promise<AppLifeCycles>;

  /** 将链接数组转化成标准 Source 数组 */
  normalizeSource: <T extends SourceScript | SourceStyle>(sources?: (T | string)[], assetsPublicPath?: string) => T[];

  /** 查找 SourceScript */
  findScript: (src: string | undefined, app: IApp) => SourceScript | undefined;

  /** 查找 SourceStyle */
  findStyle: (src: string | undefined, app: IApp) => SourceStyle | undefined;

  /** 插入 SourceScript */
  insertScript: (script: SourceScript, app: IApp) => void;

  /** 插入 SourceStyle */
  insertStyle: (style: SourceStyle, app: IApp) => void;

  /** 删除 scripts 缓存 */
  removeScripts: (app: IApp) => void;

  /** 删除 styles 缓存 */
  removeStyles: (app: IApp) => void;
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

  /** 执行 scripts 之后获取到的导出的声明周期 */
  result?: AppLifeCycles;
}
