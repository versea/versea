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

  /**
   * 声明一个路由是否是一个碎片路由
   * @description 碎片路由和主路由不同，碎片路由仅仅作用于展示某块区域，不能嵌套其他路由。
   */
  isFragment: boolean;

  /**
   * 配置的路由对应的应用
   * @description 数组第一项是主路由应用，其他是碎片应用（仅仅控制展示某一区域的内容）。
   */
  apps: IApp[];

  /** route 额外参数 */
  meta: Record<string, unknown>;

  parent: IRoute | null;

  children: IRoute[];

  /** route 的 children 允许其他的应用的路由插入的名称, 同时也是容器名称 */
  slot?: string;

  /** route 的整个内容需要插入其他的应用的路由作为 children 的名称，同时也是容器名称 */
  fill?: string;

  /** pathToRegexp 的参数 */
  pathToRegexpOptions: PathToRegexpOptions;

  /** 具有 slot 的路由节点的数组 */
  readonly slotRoutes: IRoute[];

  /** 拼接了父节点路径的完整路径 */
  readonly fullPath: string;

  /** 深度优先遍历展开树结构 */
  flatten: () => IRoute[];

  /** 合并 route */
  merge: (route: IRoute) => void;

  /** 添加 route 子节点 */
  appendChild: (route: IRoute) => void;

  /** 将 route 转化成 matchedRoute 对象 */
  toMatchedRoute: (options: ToMatchedRouteOptions, parentAppName?: string) => MatchedRoute;

  /** 获取该 route 匹配路径的正则表达式 */
  compile: (keys: Key[]) => RegExp;
}

/** Route 实例化的参数 */
export interface RouteConfig {
  /** 匹配的路径 */
  path: string;

  /** route 额外参数 */
  meta?: RouteMeta;

  /** 声明一个路由是否是一个碎片路由 */
  isFragment?: boolean;

  /** 声明一个路由是否是一个根部碎片路由 */
  isRootFragment?: boolean;

  children?: RouteConfig[];

  /** route 的 children 允许其他的应用的路由插入的名称, 同时也是容器名称 */
  slot?: string;

  /** route 的整个内容需要插入其他的应用的路由作为 children 的名称，同时也是容器名称 */
  fill?: string;

  /** pathToRegexp 的参数 */
  pathToRegexpOptions?: PathToRegexpOptions;
}

export interface RouteMeta {
  [key: string]: unknown;

  /** 嵌套的父应用名称 */
  parentAppName?: string;

  /** 嵌套的父应用容器名称 */
  parentContainerName?: string;
}

export interface ToMatchedRouteOptions {
  params: Record<string, string>;
  query: queryString.ParsedQuery;
}

type MatchedRouteTyped = Omit<
  // eslint-disable-next-line @typescript-eslint/ban-types
  object.ExcludeValues<IRoute, Function>,
  'children' | 'fill' | 'isFragment' | 'parent' | 'pathToRegexpOptions' | 'slot' | 'slotRoutes'
> &
  ToMatchedRouteOptions & {
    /** 获取 matchedRoute 原本的 route 对象 */
    getRoute: () => IRoute;

    /** 拷贝一个新的 matchedRoute */
    clone: () => MatchedRoute;

    /** 判断两个 matchedRoute 是否相等 */
    equal: (route: MatchedRoute) => boolean;
  };

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface MatchedRoute extends MatchedRouteTyped {}
