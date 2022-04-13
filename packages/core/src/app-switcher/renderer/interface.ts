import { createServiceSymbol } from '../../utils';
import { AppSwitcherContext } from '../app-switcher-context/service';

export const IRendererKey = createServiceSymbol('IRenderer');

export interface IRenderer {
  /**
   * 计算和执行渲染
   * @description 根据 matchedRoutes 计算出 unmount 和 mount 的应用和顺序
   * ------
   * 不能直接 unmount 所有当前已经 mounted 的 apps，否则每一次切换路由，代价会非常高。我们应该保证最大可复用能力，尽量减少 unmount 和 mount 的应用。
   *
   * 举例说明，当前路由如下（当前）：
   * ```
   * [
   *   { path: 'path1', apps: [A, B], fullPath: '/path1' },
   *   { path: 'path2', apps: [A, I, J, L], fullPath: '/path1/path2' },
   *   { path: 'path3', apps: [C], fullPath: '/path1/path2/path3' },
   *   { path: 'path4', apps: [C, D], fullPath: '/path1/path2/path3/path4' },
   * ]
   * ```
   *
   * 这次匹配的结果如下（目标）：
   * ```
   * [
   *   { path: 'path1', apps: [A, B], fullPath: '/path1' },
   *   { path: 'path2', apps: [A, J, K], fullPath: '/path1/path2' },
   *   { path: 'path5', apps: [A], fullPath: '/path1/path2/path5' },
   *   { path: 'path6', apps: [A, F, G], fullPath: '/path1/path2/path5/path6' },
   *   { path: 'path7', apps: [A], fullPath: '/path1/path2/path5/path6/path7' },
   *   { path: 'path8', apps: [H], fullPath: '/path1/path2/path5/path6/path7/path8' },
   *   { path: 'path9', apps: [H, M], , fullPath: '/path1/path2/path5/path6/path7/path8/path9' },
   * ]
   * ```
   *
   * 第三行 path3 和 path5 不匹配
   * 1. unmount 阶段：销毁 path3 和之下所有 route。对应应用的销毁顺序是 D -> C ->[I, L]并行
   * 2. mount 阶段：优先渲染主路由，对应应用的 mount 顺序是 H -> K -> [F, G]并行 -> M
   */
  render: (switcherContext: AppSwitcherContext) => Promise<void>;

  /** 重置为初始状态 */
  restore: () => void;
}
