import { IApp } from '../../application/app/service';
import { MatchedRoute } from '../../navigation/route/service';
import { createServiceSymbol } from '../../utils';

export const IRendererStoreKey = createServiceSymbol('IRendererStore');

/**
 * 渲染信息 Store
 * @description 在销毁应用和渲染之后应该修改渲染信息，调用这个 Store 提供的 Action。
 * ---
 * 渲染信息是一个有两部分组成：普通路由和根部碎片路由。
 *
 * ---
 * ### 路由即渲染信息
 * #### 普通路由
 * 普通路由是普通路由树匹配的结果，本身具有父子节点关系，它能给出应用嵌套关系和渲染关系。
 *
 * ```
 *   [
 *     { path: 'path1', apps: [A], fullPath: 'path1'  },
 *     { path: 'path2', apps: [A], fullPath: 'path1/path2'  },
 *     { path: 'path3', apps: [B, C], fullPath: 'path1/path2/path3'  },
 *     { path: 'path4', apps: [D], fullPath: 'path1/path2/path3/path4'  },
 *   ]
 * ```
 *
 * 从上面的数据看出：
 *   - path2 对应的路由是 path1 路由的子节点。
 *   - 当前渲染了 A 应用，A 应用嵌套 B 应用，B 应用嵌套 D 应用。
 *   - 在 path1/path2/path3 这个路径有一个碎片应用 C；C 可能渲染在 B 的某个 dom 节点，也有可能其他应用 dom 节点。
 *   - 销毁这段路由信息应该逐步销毁，顺序是 D -> C -> B -> A。
 *
 * 因此：只用修改上面的数组数据，便可以轻松表达当前销毁和渲染状态。
 *
 * #### 根部碎片路由
 * 根部碎片路由是普通路由数组匹配的结果，它不具有父子节点关系。
 *
 * ```
 *   [
 *     { path: 'path1', apps: [A] },
 *     { path: '(.*)', apps: [B] },
 *   ]
 * ```
 *
 * 页面上有两个根部碎片应用 A 和 B；删除或增加数组元素变可以表达根部碎片应用销毁和渲染状态。
 */
export interface IRendererStore {
  /**
   * 当前的普通路由
   * @description 包含整个路由信息，主应用和碎片应用。
   */
  readonly currentRoutes: MatchedRoute[];

  /** 当前的根部碎片路由 */
  readonly currentRootFragmentRoutes: MatchedRoute[];

  /** 删除当前的普通路由该 index 位置对应的路由中的部分应用 */
  removeApps: (index: number, apps: IApp[]) => void;

  /** 删除当前的普通路由该 index 位置的路由 */
  removeRoute: (index: number) => void;

  /** 删除当前的根部碎片路由中的某个碎片路由 */
  removeRootFragmentRoute: (route: MatchedRoute) => void;

  /** 向当前的普通路由的末尾增加路由 */
  appendRoute: (route: MatchedRoute, apps?: IApp[]) => void;

  /** 设置当前的普通路由该 index 位置对应的路由中的应用 */
  setApps: (index: number, apps: IApp[]) => void;

  /** 向当前的根部碎片路由的末尾增加碎片路由 */
  appendRootFragmentRoute: (route: MatchedRoute) => void;
}
