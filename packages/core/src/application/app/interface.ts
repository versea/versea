import { RouteOptions } from '../../navigation/route/service';
import { createServiceSymbol } from '../../utils';

export const IAppKey = createServiceSymbol('IApp');

export interface AppHooks {
  bootstrap?: () => Promise<unknown>;
  mount: () => Promise<unknown>;
  unmount: () => Promise<unknown>;
}

export type FunctionalAppProps = (name: string) => Record<string, unknown>;
export type AppProps = FunctionalAppProps | Record<string, unknown>;

export interface IApp {
  /** 应用名称 */
  name: string;

  /** 加载应用的方法 */
  loadApp: () => Promise<AppHooks>;

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

  /** 加载应用的方法 */
  loadApp?: () => Promise<AppHooks>;
}
