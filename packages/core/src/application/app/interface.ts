import { IAppSwitcherContext } from '../../app-switcher/app-switcher-context/interface';
import { IStatus } from '../../enum/status';
import { RouteConfig } from '../../navigation/route/interface';
import { createServiceSymbol } from '../../utils';

export const IAppKey = createServiceSymbol('IApp');

export type AppConfigProps = Record<string, unknown> | ((name: string) => Record<string, unknown>);

/** 传给加载和挂载的各个阶段的 Hooks 函数的属性 */
export interface AppProps extends Record<string, unknown> {
  /** 应用实例 */
  app: IApp;

  /** 当前正在运行的应用切换上下文 */
  context: IAppSwitcherContext;
}

export type AppHookFunction<T = unknown> = (props: AppProps) => Promise<T>;

/**
 * 应用加载函数的返回的 Hooks
 * @description 应用加载和挂载的各个阶段会分别调用这些 Hooks。
 */
export interface AppHooks {
  bootstrap?: AppHookFunction;
  mount?: AppHookFunction<Record<string, AppHookFunction>> | AppHookFunction<void>;
  unmount?: AppHookFunction;
}

export interface IApp {
  /** 应用名称 */
  readonly name: string;

  /** 当前应用的状态 */
  status: IStatus[keyof IStatus];

  /** 应用是否已经加载 */
  isLoaded: boolean;

  /** 应用是否已经执行引导 */
  isBootstrapped: boolean;

  /** 加载应用 */
  load: (context: IAppSwitcherContext) => Promise<void>;

  /**
   * 引导
   * @description 应用内容首次挂载到页面前调用。
   */
  bootstrap: (context: IAppSwitcherContext) => Promise<void>;

  /** 挂载应用 */
  mount: (context: IAppSwitcherContext) => Promise<void>;

  /** 卸载应用 */
  unmount: (context: IAppSwitcherContext) => Promise<void>;

  /** 获取传给加载和挂载的各个阶段 Hooks 函数的属性 */
  getProps: (context: IAppSwitcherContext) => AppProps;

  /**
   * 等待应用内部容器渲染完成
   * @param containerName - 能嵌套应用的容器的名称
   * @description 参考 issue https://github.com/versea/versea/issues/8。
   */
  waitForChildContainer: (containerName: string, context: IAppSwitcherContext) => Promise<void>;
}

/** App 实例化的参数 */
export interface AppConfig {
  /** 应用名称 */
  name: string;

  /** 应用的路由配置 */
  routes?: RouteConfig[];

  /**
   * 应用的属性
   * @description 透传给应用加载和挂载的各个阶段 Hooks 函数的属性。
   */
  props?: AppConfigProps;

  /** 加载应用 */
  loadApp?: (props: AppProps) => Promise<AppHooks>;
}

export interface AppDependencies {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Status: IStatus;
}
