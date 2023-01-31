import { TokensToRegexpOptions, ParseOptions, Key } from 'path-to-regexp';
import queryString from 'query-string';
import { object } from 'typescript-lodash';

import { IApp } from '../../application/app/interface';
import { createServiceSymbol } from '../../utils';

export const IRoute = createServiceSymbol('IRoute');

export type PathToRegexpOptions = ParseOptions & TokensToRegexpOptions;

export interface IRoute {
  /** 匹配的路径 */
  path: string;

  /**
   * 是否是一个碎片路由
   * @description 碎片路由和主路由不同，碎片路由仅仅作用于展示某块区域，不能嵌套其他路由。
   */
  isFragment: boolean;

  /**
   * 配置的路由对应的应用
   * @description 数组第一项是主应用，其他是碎片应用（仅仅控制展示某一区域的内容）。
   */
  apps: IApp[];

  /** route 元信息 */
  meta: Record<string, unknown>;

  parent: IRoute | null;

  children: IRoute[];

  /** route 的 children 允许其他的路由插入的名称, 同时 slot 也是容器名称 */
  slot?: string;

  /** route 的整个内容需要插入其他的路由作为 children 的名称，同时 fill 也是容器名称 */
  fill?: string;

  /** pathToRegexp 的参数 */
  pathToRegexpOptions: PathToRegexpOptions;

  /** 具有 slot 的路由节点数组 */
  readonly slotRoutes: IRoute[];

  /** 完整路径 */
  readonly fullPath: string;

  /** 深度优先遍历展开树结构 */
  flatten: () => IRoute[];

  /** 合并 route */
  merge: (route: IRoute) => void;

  /** 添加 route 子节点 */
  appendChild: (route: IRoute) => void;

  /** 转化 route 为 matchedRoute 对象 */
  toMatchedRoute: (options: ToMatchedRouteOptions) => MatchedRoute;

  /** 获取该 route 匹配路径的正则表达式 */
  compile: (keys: Key[]) => RegExp;
}

/** Route 实例化的参数 */
export interface RouteConfig {
  /** 匹配的路径 */
  path: string;

  /** route 元信息 */
  meta?: RouteMeta;

  /** 是否是一个碎片路由 */
  isFragment?: boolean;

  /** 是否是一个根部碎片路由 */
  isRootFragment?: boolean;

  children?: RouteConfig[];

  /** route 的 children 允许其他的路由插入的名称, 同时 slot 也是容器名称 */
  slot?: string;

  /** route 的整个内容需要插入其他的路由作为 children 的名称，同时 fill 也是容器名称 */
  fill?: string;

  /** pathToRegexp 的参数 */
  pathToRegexpOptions?: PathToRegexpOptions;
}

export interface RouteMeta {
  [key: string]: unknown;

  /** 具有嵌套路由的父应用名称 */
  parentAppName?: string;

  /** 具有嵌套路由的父应用的容器名称 */
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

    /** 拷贝 matchedRoute 对象 */
    cloneDeep: () => MatchedRoute;

    /** 判断两个 matchedRoute 是否相等 */
    equal: (route: MatchedRoute) => boolean;

    /** 获取应用对应的 route 元信息 */
    getMeta: (app: IApp) => RouteMeta;
  };

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface MatchedRoute extends MatchedRouteTyped {}
