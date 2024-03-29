import { AppLifeCycles, AppProps, createServiceSymbol, IApp, IPlugin } from '@versea/core';
import { AsyncSeriesHook, HookContext } from '@versea/tapable';

import { ExecSourceHookContext, LoadSourceHookContext } from '../source-controller/interface';

export const IPluginSourceEntry = createServiceSymbol('IPluginSourceEntry');

export interface IPluginSourceEntry extends IPlugin {
  isApplied: boolean;
}

export interface LoadAppHookContext extends HookContext {
  app: IApp;

  /** Load 参数 */
  props: AppProps;

  /** 应用的生命周期函数 */
  lifeCycles?: AppLifeCycles;
}

export interface MountAppHookContext extends HookContext {
  app: IApp;

  /** Mount 参数 */
  props: AppProps;

  /** 应用的生命周期函数 */
  lifeCycles: AppLifeCycles;

  /** 设置应用导出的生命周期 */
  setLifeCycles: (lifeCycles: AppLifeCycles) => void;

  /** Mount 返回的结果 */
  result?: unknown;
}

export interface UnmountAppHookContext extends HookContext {
  app: IApp;

  /** Unmount 参数 */
  props: AppProps;

  /** 应用的生命周期函数 */
  lifeCycles: AppLifeCycles;

  /** Unmount 返回的结果 */
  result?: unknown;
}

/** 样式资源描述 */
export interface SourceStyle {
  /** 样式链接 */
  src?: string;

  /** 样式代码 */
  code?: Promise<string> | string;

  /** 被替换的资源的 placeholder */
  placeholder?: Node;

  /** 是否是全局样式 */
  isGlobal?: boolean;

  /** 是否忽略沙箱 */
  ignore?: boolean;
}

/** 脚本资源描述 */
export interface SourceScript {
  /** 脚本链接 */
  src?: string;

  /** 脚本代码 */
  code?: Promise<string> | string;

  /** 异步脚本 */
  async?: boolean;

  /** 是否是 module */
  module?: boolean;

  /** 是否是全局脚本 */
  isGlobal?: boolean;

  /** 是否忽略沙箱 */
  ignore?: boolean;
}

/**
 * 插件内部使用的 IApp
 * @description 插件在 IApp 增加一些不希望使用者需要理解的属性
 */
export interface IInternalApp extends IApp {
  /**
   * 容器名称
   * @example #app
   */
  _parentContainer?: string | ((context: MountAppHookContext | UnmountAppHookContext) => string);

  /** 禁用渲染内容 */
  _disableRenderContent?: boolean;

  /**
   * 文档内容
   * @example <div><h1>title</h1><div id="sub-app-name"></div></div>
   */
  _documentFragment?: Promise<string> | string;

  /** 文档内容外层 div className */
  _documentFragmentWrapperClass?: string;

  /** 资源是否已经被执行 */
  _isSourceExecuted?: boolean;

  /** UMD 导出名称 */
  _libraryName?: string;

  /** 获取资源文件 */
  _fetch?: (url: string, options?: RequestInit) => Promise<string>;
}

declare module '@versea/core' {
  interface IConfig {
    /**
     * 默认容器节点
     * @example #app
     */
    defaultContainer?: string;

    /** 获取资源文件 */
    fetch?: (url: string, options?: RequestInit, app?: IApp) => Promise<string>;
  }

  interface IHooks {
    /** 加载应用 */
    loadApp: AsyncSeriesHook<LoadAppHookContext>;

    /** 渲染应用 */
    mountApp: AsyncSeriesHook<MountAppHookContext>;

    /** 卸载应用 */
    unmountApp: AsyncSeriesHook<UnmountAppHookContext>;

    /** 根据 app 上的资源文件信息加载资源文件 */
    loadSource: AsyncSeriesHook<LoadSourceHookContext>;

    /** 根据 app 上的 scripts 信息执行 scripts */
    execSource: AsyncSeriesHook<ExecSourceHookContext>;
  }

  interface AppConfig {
    /**
     * 容器名称
     * @example #app
     */
    container?: string | ((context: MountAppHookContext | UnmountAppHookContext) => string);

    /**
     * 文档内容
     * @example <div><h1>title</h1><div id="sub-app-name"></div></div>
     */
    documentFragment?: Promise<string> | string;

    /** 文档内容外层 div className */
    documentFragmentWrapperClass?: string;

    /**
     * 应用样式
     * @example 'https://xxx/xxx.css'
     */
    styles?: (SourceStyle | string)[];

    /**
     * 应用脚本
     * @example 'https://xxx/xxx.js'
     */
    scripts?: (SourceScript | string)[];

    /** 入口路径 */
    entry?: string;

    /** 资源文件公共路径 */
    assetsPublicPath?: string;

    /** UMD 导出名称 */
    libraryName?: string;

    /** 禁用渲染内容 */
    disableRenderContent?: boolean;

    /** 获取资源文件 */
    fetch?: (url: string, options?: RequestInit) => Promise<string>;
  }

  interface IApp {
    /** 容器节点 */
    container?: HTMLElement;

    /** 应用样式 */
    styles?: SourceStyle[];

    /** 应用脚本 */
    scripts?: SourceScript[];

    /** 应用入口路径 */
    entry?: string;

    /** 资源文件公共路径 */
    assetsPublicPath?: string;
  }
}
