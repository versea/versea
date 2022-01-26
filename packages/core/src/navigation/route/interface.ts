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

  children: IRoute[] | null;
}

/** Route 实例化的参数 */
export interface RouteOptions {
  /** 匹配的路径 */
  path: string;

  /** route 额外参数 */
  meta?: Record<string, any>;

  children?: RouteOptions[];
}
