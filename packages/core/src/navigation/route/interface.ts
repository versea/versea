import { OmitSubType } from '@versea/shared';

import { IApp } from '../../application/app/service';
import { createServiceSymbol } from '../../utils';

export const IRouteKey = createServiceSymbol('IRoute');

export interface IRoute {
  /** 匹配的路径 */
  path: string;

  /** 配置的路由对应的应用 */
  apps: IApp[];

  /** route 额外参数 */
  meta?: Record<string, unknown>;

  parent: IRoute | null;

  children: IRoute[];

  /** 该 route 的 children 允许其他的应用的路由插入 */
  slot?: string;

  /** 该 route 的整个内容需要插入其他的应用的路由的 children */
  fill?: string;

  /** 具有 slot 的路由节点的数组 */
  readonly slotRoutes: IRoute[];

  /** 用来匹配的完整路径 */
  readonly fullPath: string;

  flatten: () => IRoute[];

  toMatchedRoute: () => MatchedRoute;

  merge: (route: IRoute) => void;

  appendChild: (route: IRoute) => void;
}

/** Route 实例化的参数 */
export interface RouteOptions {
  /** 匹配的路径 */
  path: string;

  /** route 额外参数 */
  meta?: Record<string, unknown>;

  children?: RouteOptions[];

  /** 该 route 的 children 允许其他的应用的路由插入 */
  slot?: string;

  /** 该 route 的整个内容需要插入其他的应用的路由的 children */
  fill?: string;

  /** 编译 pathToRegexp 的参数 */
  pathToRegexpOptions?: Record<string, unknown>;
}

export interface MatchedRoute
  // eslint-disable-next-line @typescript-eslint/ban-types
  extends Omit<OmitSubType<IRoute, Function>, 'children' | 'fill' | 'parent' | 'slot' | 'slotRoutes'> {
  params: Record<string, unknown>;
  query: Record<string, unknown>;
  hash: string;
}
