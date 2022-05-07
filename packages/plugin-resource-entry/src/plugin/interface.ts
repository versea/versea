import { AppConfig, AppHooks, AppProps, createServiceSymbol, IApp, IPlugin } from '@versea/core';
import { AsyncSeriesHook, HookContext } from '@versea/tapable';

export const IPluginResourceEntryKey = createServiceSymbol('IPluginResourceEntry');

export interface IPluginResourceEntry extends IPlugin {
  getContainerElement: (context: MountAppHookContext | UnmountAppHookContext) => HTMLElement;
}

export interface LoadAppHookContext extends HookContext {
  app: IApp;
  config: AppConfig;
  props: AppProps;
  container?: HTMLElement;
  appHooks?: AppHooks;
}

export interface MountAppHookContext extends HookContext {
  app: IApp;
  config: AppConfig;
  props: AppProps;
  container: HTMLElement;
  mount: AppHooks['mount'];
  result?: unknown;
}

export interface UnmountAppHookContext extends HookContext {
  app: IApp;
  config: AppConfig;
  props: AppProps;
  container: HTMLElement;
  unmount: AppHooks['unmount'];
  result?: unknown;
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
     * @example <div><h1>title</h1><div id="sub_app_name"></div></div>
     */
    documentFragment?: string;

    /** 应用样式路径 */
    styles?: string[];

    /** 应用脚本路径 */
    scripts?: string[];
  }

  export interface IHooks {
    /** 加载应用 */
    loadApp: AsyncSeriesHook<LoadAppHookContext>;

    /** 渲染应用 */
    mountApp: AsyncSeriesHook<MountAppHookContext>;

    /** 卸载应用 */
    unmountApp: AsyncSeriesHook<UnmountAppHookContext>;
  }

  export interface IApp {
    /** 容器节点 */
    container?: HTMLElement | null;
  }

  export interface IConfig {
    defaultContainer?: string;
  }
}
