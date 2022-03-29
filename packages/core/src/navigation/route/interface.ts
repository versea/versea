import { TokensToRegexpOptions, ParseOptions, Key } from 'path-to-regexp';
import queryString from 'query-string';
import { object } from 'typescript-lodash';

import { IApp } from '../../application/app/service';
import { createServiceSymbol } from '../../utils';

export const IRouteKey = createServiceSymbol('IRoute');

export type PathToRegexpOptions = ParseOptions & TokensToRegexpOptions;

export interface IRoute {
  /** 匹配的路径 */
  path: string;

  /** 是否是一个主路由，在没有 children 和 slot 时，用这个字段判断 */
  isMainRoute: boolean;

  /** 配置的路由对应的应用 */
  apps: IApp[];

  /** route 额外参数 */
  meta: Record<string, unknown>;

  parent: IRoute | null;

  children: IRoute[];

  /** 该 route 的 children 允许其他的应用的路由插入 */
  slot?: string;

  /** 该 route 的整个内容需要插入其他的应用的路由的 children */
  fill?: string;

  pathToRegexpOptions: PathToRegexpOptions;

  /** 具有 slot 的路由节点的数组 */
  readonly slotRoutes: IRoute[];

  /** 用来匹配的完整路径 */
  readonly fullPath: string;

  flatten: () => IRoute[];

  merge: (route: IRoute) => void;

  appendChild: (route: IRoute) => void;

  toMatchedRoute: (options: ToMatchedRouteOptions) => MatchedRoute;

  compile: (keys: Key[]) => RegExp;
}

/** Route 实例化的参数 */
export interface RouteOptions {
  /** 匹配的路径 */
  path: string;

  /** route 额外参数 */
  meta?: Record<string, unknown>;

  /** 是否是一个主路由，在没有 children 和 slot 时，用这个字段判断 */
  isMainRoute?: boolean;

  children?: RouteOptions[];

  /** 该 route 的 children 允许其他的应用的路由插入 */
  slot?: string;

  /** 该 route 的整个内容需要插入其他的应用的路由的 children */
  fill?: string;

  /** 编译 pathToRegexp 的参数 */
  pathToRegexpOptions?: PathToRegexpOptions;
}

export interface ToMatchedRouteOptions {
  params: Record<string, string>;
  query: queryString.ParsedQuery;
}

export type MatchedRoute = Omit<
  // eslint-disable-next-line @typescript-eslint/ban-types
  object.ExcludeValues<IRoute, Function>,
  'children' | 'fill' | 'isMainRoute' | 'parent' | 'pathToRegexpOptions' | 'slot' | 'slotRoutes'
> &
  ToMatchedRouteOptions & {
    getRoute: () => IRoute;
  };
