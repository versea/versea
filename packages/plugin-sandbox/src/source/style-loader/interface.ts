import { createServiceSymbol, IApp } from '@versea/core';
import { LoadSourceHookContext, SourceStyle } from '@versea/plugin-source-entry';
import { HookContext } from '@versea/tapable';

export const IStyleLoader = createServiceSymbol('IStyleLoader');

export interface IStyleLoader {
  /** 增加监听函数 */
  apply: () => void;

  /** 加载资源文件 */
  load: (context: LoadSourceHookContext) => Promise<void>;

  /** 等待加载资源文件完成  */
  waitLoaded: (app: IApp) => Promise<void>;

  /** 释放 app 加载的资源文件内容 */
  dispose: (app: IApp) => void;

  /** 尝试设置 style.code */
  ensureCode: (style: SourceStyle, app: IApp) => Promise<void>;

  /** 给样式表增加前缀 */
  scopeCSS: (styleLink: HTMLStyleElement, style: SourceStyle, app: IApp) => void;

  /**
   * 动态添加样式
   * @param originElement 原始 Link 元素
   * @param styleElement 替换的 Style 元素
   */
  addDynamicStyle: (
    style: SourceStyle,
    app: IApp,
    originElement: HTMLLinkElement,
    styleElement: HTMLStyleElement,
  ) => void;
}

export interface LoadStyleHookContext extends HookContext {
  app: IApp;

  /** 样式文件描述 */
  style: SourceStyle;
}

export interface LoadDynamicStyleHookContext extends HookContext {
  app: IApp;

  /** 样式文件描述 */
  style: SourceStyle;

  /** 缓存样式文件描述 */
  cachedStyle?: SourceStyle;

  /** 原始 Link 元素  */
  originElement: HTMLLinkElement;

  /** 替换的 Style 元素 */
  styleElement: HTMLStyleElement;
}
