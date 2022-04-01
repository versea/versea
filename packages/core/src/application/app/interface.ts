import { IAppSwitcherContext } from '../../app-switcher/app-switcher-context/service';
import { IStatus } from '../../constants/status';
import { RouteOptions } from '../../navigation/route/service';
import { createServiceSymbol } from '../../utils';

export const IAppKey = createServiceSymbol('IApp');

export type AppOptionsProps = Record<string, unknown> | ((name: string) => Record<string, unknown>);

export interface AppProps extends Record<string, unknown> {
  name: string;
  app: IApp;
  context: IAppSwitcherContext;
}

export type HookFunction<T = unknown> = (props: AppProps) => Promise<T>;

export interface AppHooks {
  bootstrap?: HookFunction;
  mount?: HookFunction<Record<string, HookFunction>> | HookFunction<void>;
  unmount?: HookFunction;
}

export interface IApp {
  /** 应用名称 */
  readonly name: string;

  /** 当前应用的状态 */
  status: IStatus[keyof IStatus];

  /** 应用是否已经加载 */
  isLoaded: boolean;

  /** 应用是否已经 Bootstrap */
  isBootstrapped: boolean;

  /** 加载应用 */
  load: (context: IAppSwitcherContext) => Promise<void>;

  /** 引导，应用内容首次挂载到页面前调用 */
  bootstrap: (context: IAppSwitcherContext) => Promise<void>;

  /** 挂载应用 */
  mount: (context: IAppSwitcherContext) => Promise<void>;

  /**
   * 等待容器渲染完成
   * @description 参考 issue https://github.com/versea/versea/issues/8
   * @param name - 嵌套的应用的名称
   */
  waitForChildContainer: (name: string, context: IAppSwitcherContext) => Promise<void>;

  /** 卸载应用 */
  unmount: (context: IAppSwitcherContext) => Promise<void>;

  /** 获取最终传给应用 loadApp 和 mount 方法的属性 */
  getProps: (context: IAppSwitcherContext) => AppProps;
}

/** App 实例化的参数 */
export interface AppOptions {
  /** 应用名称 */
  name: string;

  /** 应用的路由 */
  routes?: RouteOptions[];

  /** 传给应用的属性 */
  props?: AppOptionsProps;

  /**
   * 加载应用的方法
   * @description 必须传入，这里设计成可选参数，因为某些插件会生成这个函数。
   */
  loadApp?: (props: AppProps) => Promise<AppHooks>;
}

export interface AppDependencies {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Status: IStatus;
}
