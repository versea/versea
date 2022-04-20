import { IApp } from '../../application/app/service';
import { MatchedRoute } from '../../navigation/route/service';
import { createServiceSymbol } from '../../utils';

export const IRouteStateKey = createServiceSymbol('IRouteState');

/**
 * 路由状态（当前页面路由和应用状态存储器）
 * @description 销毁应用和渲染应用之后应该修改路由状态。
 * ---
 * 路由状态由两部分组成：普通路由和根部碎片路由。
 *
 * ---
 * ### 路由是存储器
 * #### 普通路由
 * 普通路由是普通路由树匹配的结果，本身具有父子节点关系，它能给出应用嵌套关系和渲染关系。举例说明：
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
 * 从上面的普通路由看出：
 *   - path2 对应的路由是 path1 路由的子节点。
 *   - 当前渲染了 A 应用，A 应用嵌套 B 应用，B 应用嵌套 D 应用。
 *   - 在 path1/path2/path3 这个路径有一个碎片应用 C，C 可能渲染在 B 的某个 dom 节点，也有可能其他应用 dom 节点。
 *   - 如果需要销毁这个路由信息，逐步销毁的顺序是 D -> C -> B -> A。
 *
 * #### 根部碎片路由
 * 根部碎片路由是根部碎片路由数组匹配的结果，不具有父子节点关系。举例说明：
 *
 * ```
 *   [
 *     { path: 'path1', apps: [A] },
 *     { path: '(.*)', apps: [B] },
 *   ]
 * ```
 *
 * 从上面的根部碎片路由看出，页面上有两个根部碎片应用 A 和 B，渲染在基座应用的 dom 节点。
 */
export interface IRouteState {
  /** 当前的普通路由 */
  readonly current: MatchedRoute[];

  /** 当前的根部碎片路由 */
  readonly currentRootFragments: MatchedRoute[];

  /** 删除当前的普通路由该 index 位置对应的路由中的部分应用 */
  removeApps: (index: number, apps: IApp[]) => void;

  /** 向当前的普通路由该 index 位置对应的路由中的添加应用 */
  appendApps: (index: number, apps: IApp[]) => void;

  /** 删除当前的普通路由末尾的路由 */
  pop: () => void;

  /** 向当前的普通路由的末尾增加路由 */
  append: (route: MatchedRoute, apps?: IApp[]) => void;

  /** 删除当前的根部碎片路由中的某个碎片路由 */
  removeRootFragment: (route: MatchedRoute) => void;

  /** 向当前的根部碎片路由的末尾增加碎片路由 */
  appendRootFragment: (route: MatchedRoute) => void;
}
