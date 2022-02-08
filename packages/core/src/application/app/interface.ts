import { IStatusEnum } from '../../constants/status';
import { RouteOptions } from '../../navigation/route/service';
import { createServiceSymbol } from '../../utils';

export const IAppKey = createServiceSymbol('IApp');

export interface AppHooks {
  bootstrap?: (props: Record<string, unknown>) => Promise<unknown>;
  mount?: (props: Record<string, unknown>) => Promise<unknown>;
  unmount?: (props: Record<string, unknown>) => Promise<unknown>;
  unload?: (props: Record<string, unknown>) => Promise<unknown>;
}

export type AppProps = Record<string, unknown> | ((name: string) => Record<string, unknown>);

export interface IApp {
  /** 应用名称 */
  name: string;

  /** 加载应用 */
  load: () => Promise<void>;

  /** 引导，应用内容首次挂载到页面前调用 */
  bootstrap: () => Promise<void>;

  /** 挂载应用 */
  mount: () => Promise<void>;

  /** 卸载应用 */
  unmount: () => Promise<void>;

  /** 获取最终传给应用 loadApp 和 mount 方法的属性 */
  getProps: () => Record<string, unknown>;
}

/** App 实例化的参数 */
export interface AppOptions {
  /** 应用名称 */
  name: string;

  /** 应用的路由 */
  routes?: RouteOptions[];

  /** 传给应用的属性 */
  props?: AppProps;

  /**
   * 加载应用的方法
   * @description 必须传入，这里设计成可选参数，因为某些插件会生成这个函数。
   */
  loadApp?: (props: Record<string, unknown>) => Promise<AppHooks>;
}

export interface AppDependencies {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  StatusEnum: IStatusEnum;
}
