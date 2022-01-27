/* eslint-disable @typescript-eslint/no-explicit-any */
import { IApp } from '../../application/app/service';
import { createServiceSymbol } from '../../utils';

export const IRouteKey = createServiceSymbol('IRoute');

export interface IRoute {
  /** 匹配的路径 */
  path: string;

  /** 配置的路由对应的应用 */
  apps: IApp[];

  /** route 额外参数 */
  meta?: Record<string, any>;

  parent: IRoute | null;

  children: IRoute[];

  /** 该 route 的 children 允许其他的应用的路由插入 */
  slot?: string;

  /** 该 route 的整个内容需要插入其他的应用的路由的 children */
  fill?: string;

  readonly slotRoutes: IRoute[];

  flatten: () => IRoute[];
}

/** Route 实例化的参数 */
export interface RouteOptions {
  /** 匹配的路径 */
  path: string;

  /** route 额外参数 */
  meta?: Record<string, any>;

  children?: RouteOptions[];

  /** 该 route 的 children 允许其他的应用的路由插入 */
  slot?: string;

  /** 该 route 的整个内容需要插入其他的应用的路由的 children */
  fill?: string;
}
