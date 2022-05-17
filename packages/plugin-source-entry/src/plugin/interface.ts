import { AppConfig, AppLifeCycles, AppProps, createServiceSymbol, IApp, IPlugin } from '@versea/core';
import { AsyncSeriesHook, HookContext } from '@versea/tapable';

import { ExecSourceHookContext, LoadSourceHookContext } from '../source-controller/interface';

export const IPluginSourceEntryKey = createServiceSymbol('IPluginSourceEntry');

export interface IPluginSourceEntry extends IPlugin {
  isApplied: boolean;
}

export interface LoadAppHookContext extends HookContext {
  app: IApp;
  config: AppConfig;

  /** Load 参数 */
  props: AppProps;

  /** 应用的生命周期函数 */
  lifeCycles?: AppLifeCycles;
}

export interface MountAppHookContext extends HookContext {
  app: IApp;
  config: AppConfig;

  /** Mount 参数 */
  props: AppProps;

  /** 应用的生命周期函数 */
  lifeCycles: AppLifeCycles;

  /** 修改应用已有的生命周期函数 */
  dangerouslySetLifeCycles: (lifeCycles: AppLifeCycles) => void;

  /** Mount 返回的结果 */
  result?: unknown;
}

export interface UnmountAppHookContext extends HookContext {
  app: IApp;
  config: AppConfig;

  /** Unmount 参数 */
  props: AppProps;

  /** 应用的生命周期函数 */
  lifeCycles: AppLifeCycles;

  /** Unmount 返回的结果 */
  result?: unknown;
}

export interface SourceStyle {
  src?: string;
  code?: Promise<string> | string;
  placeholder?: Node;
  isGlobal?: boolean;
}

export interface SourceScript {
  src?: string;
  code?: Promise<string> | string;
  async?: boolean;
  module?: boolean;
  isGlobal?: boolean;
}

declare module '@versea/core' {
  export interface AppConfig {
    /**
     * 容器名称
     * @example #app
     */
    container?: string;

    /**
     * 文档内容
     * @example <div><h1>title</h1><div id="sub-app-name"></div></div>
     */
    documentFragment?: string;

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

    /** 禁用渲染容器 */
    disableRenderContainer?: boolean;
  }

  export interface IHooks {
    /** 加载应用 */
    loadApp: AsyncSeriesHook<LoadAppHookContext>;

    /** 渲染应用 */
    mountApp: AsyncSeriesHook<MountAppHookContext>;

    /** 卸载应用 */
    unmountApp: AsyncSeriesHook<UnmountAppHookContext>;

    /**
     * 根据 app 上的资源文件信息加载资源文件
     * @description 加载资源文件，并把 css 加入容器（css 加入容器是异步的）
     */
    loadSource: AsyncSeriesHook<LoadSourceHookContext>;

    /** 根据 app 上的 scripts 信息执行 scripts */
    execSource: AsyncSeriesHook<ExecSourceHookContext>;
  }

  export interface IApp {
    /** 容器节点 */
    container?: HTMLElement | null;

    /** 应用样式 */
    styles?: SourceStyle[];

    /** 应用脚本 */
    scripts?: SourceScript[];

    /** 禁用渲染容器 */
    disableRenderContainer?: boolean;
  }

  export interface IConfig {
    defaultContainer?: string;
  }
}
