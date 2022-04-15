import { IApp } from '../../application/app/service';
import { MatchedRoute } from '../../navigation/route/service';
import { createServiceSymbol } from '../../utils';

export const IRendererStoreKey = createServiceSymbol('IRendererStore');

/**
 * 路由 Store
 * @description 当前正在使用的路由，在修改当前匹配的路由时，应该调用 Store 提供的这些 Action。
 */
export interface IRendererStore {
  /**
   * 当前正在使用的普通路由
   * @description 包含整个路由信息，主应用和碎片应用。
   */
  readonly currentRoutes: MatchedRoute[];

  /** 当前正在使用的根部碎片路由 */
  readonly currentRootFragmentRoutes: MatchedRoute[];

  /** 删除当前正在使用的普通路由该 index 位置对应的路由中的部分应用 */
  removeApps: (index: number, apps: IApp[]) => void;

  /** 删除当前正在使用的普通路由该 index 位置的路由 */
  removeRoute: (index: number) => void;

  /** 删除当前正在使用的根部碎片路由中的某个碎片路由 */
  removeRootFragmentRoute: (route: MatchedRoute) => void;

  /** 向当前正在使用的普通路由的末尾增加路由 */
  appendRoute: (route: MatchedRoute, apps?: IApp[]) => void;

  /** 设置当前正在使用的普通路由该 index 位置对应的路由中的应用 */
  setApps: (index: number, apps: IApp[]) => void;

  /** 向当前正在使用的根部碎片路由的末尾增加碎片路由 */
  appendRootFragmentRoute: (route: MatchedRoute) => void;
}
