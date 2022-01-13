/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServiceSymbol } from '../../utils';

export const IAppKey = createServiceSymbol('IApp');

export interface AppHooks {
  bootstrap?: () => Promise<any>;
  mount: () => Promise<any>;
  unmount: () => Promise<any>;
}

export type FunctionalAppProps = (name: string) => Record<string, any>;
export type AppProps = FunctionalAppProps | Record<string, any>;

export interface IApp {
  /** 应用名称 */
  name: string;

  /** 应用的路径 */
  path: string;

  /** 加载应用的方法 */
  loadApp: () => Promise<AppHooks>;

  getProps: () => Record<string, any>;
}

/** App 实例化的参数 */
export interface AppOptions {
  /** 应用名称 */
  name: string;

  /** 应用的路径 */
  path: string;

  /** 传给子应用的属性 */
  props?: AppProps;

  /** 加载应用的方法 */
  loadApp: () => Promise<AppHooks>;
}
