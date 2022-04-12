import { IApp } from '../../application/app/service';
import { MatchedRoute } from '../../navigation/route/service';
import { createServiceSymbol } from '../../utils';

export const IRendererStoreKey = createServiceSymbol('IRendererStore');

/** 当前正在运行的路由以及渲染的应用 */
export interface IRendererStore {
  /**
   * 当前正在运行的路由
   * @description 包含整个路由信息，主路由应用和碎片路由应用。
   */
  readonly currentRoutes: MatchedRoute[];

  /** 当前正在运行的根部碎片路由 */
  readonly currentRootFragmentRoutes: MatchedRoute[];

  /** 删除 currentRoutes 该 index 中的 apps */
  removeApps: (index: number, apps: IApp[]) => void;

  /** 删除 currentRoutes 该 index 的 route */
  removeRoute: (index: number) => void;

  /** 删除 currentRootFragmentRoutes 中的 route */
  removeRootFragmentRoute: (route: MatchedRoute) => void;
}
