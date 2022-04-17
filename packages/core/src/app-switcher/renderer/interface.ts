import { createServiceSymbol } from '../../utils';
import { AppSwitcherContext } from '../app-switcher-context/service';

export const IRendererKey = createServiceSymbol('IRenderer');

export interface IRenderer {
  /**
   * 计算和执行渲染
   * @description 一套默认的销毁和渲染算法
   * ------
   * #### 普通路由
   * 本算法不是直接销毁所有当前已渲染的应用，而是尽最大可能保证应用复用，尽量销毁和渲染。
   *
   * 假设当前路由：
   * ```
   * [
   *   { path: 'path1', apps: [A, B], fullPath: '/path1' },
   *   { path: 'path2', apps: [A, I, J, L], fullPath: '/path1/path2' },
   *   { path: 'path3', apps: [C], fullPath: '/path1/path2/path3' },
   *   { path: 'path4', apps: [C, D], fullPath: '/path1/path2/path3/path4' },
   * ]
   * ```
   *
   * 当前路由：
   * ```
   * [
   *   { path: 'path1', apps: [A, B], fullPath: '/path1' },
   *   { path: 'path2', apps: [A, J, K], fullPath: '/path1/path2' },
   *   { path: 'path5', apps: [A], fullPath: '/path1/path2/path5' },
   *   { path: 'path6', apps: [A, F, G], fullPath: '/path1/path2/path5/path6' },
   *   { path: 'path7', apps: [A], fullPath: '/path1/path2/path5/path6/path7' },
   *   { path: 'path8', apps: [H], fullPath: '/path1/path2/path5/path6/path7/path8' },
   *   { path: 'path9', apps: [H, M], fullPath: '/path1/path2/path5/path6/path7/path8/path9' },
   * ]
   * ```
   *
   * 1. 计算得出第三行 path3 和 path5 不匹配，记录不匹配位置。
   * 2. 销毁阶段：先销毁 path3 及之下所有 route。后销毁 path3 之上多余的碎片应用。因此应用的销毁顺序是 D -> C -> [I, L]（数组表示并行）
   * 2. 渲染阶段：优先渲染主路由，在渲染碎片应用。因此应用的渲染顺序是 H -> K -> [F, G] -> M
   *
   * #### 根部碎片路由
   * 根部碎片路由的销毁和渲染比较简单，只需要先销毁目标路由不需要的应用，再渲染目标路由需要但当前没有渲染的应用。
   */
  render: (switcherContext: AppSwitcherContext) => Promise<void>;

  /** 重置为初始状态 */
  restore: () => void;
}
