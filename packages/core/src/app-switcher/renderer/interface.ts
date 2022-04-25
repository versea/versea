import { createServiceSymbol } from '../../utils';
import { IAppSwitcherContext } from '../app-switcher-context/interface';

export const IRendererKey = createServiceSymbol('IRenderer');

export interface IRenderer {
  /**
   * 计算和执行渲染
   * @description 一套默认的销毁和渲染算法，本算法不直接销毁所有当前已渲染的应用，而是尽最大可能保证应用复用，尽量减小销毁和渲染。
   * ------
   * #### 普通路由销毁和渲染
   *
   * 假设当前路由：
   * ```
   * [
   *   { path: 'path1', apps: [A, D], fullPath: '/path1' },
   *   { path: 'path2', apps: [A, E, F, G], fullPath: '/path1/path2' },
   *   { path: 'path3', apps: [B], fullPath: '/path1/path2/path3' },
   *   { path: 'path4', apps: [B, H], fullPath: '/path1/path2/path3/path4' },
   * ]
   * ```
   *
   * 目标路由：
   * ```
   * [
   *   { path: 'path1', apps: [A, D], fullPath: '/path1' },
   *   { path: 'path2', apps: [A, E, I], fullPath: '/path1/path2' },
   *   { path: 'path5', apps: [A], fullPath: '/path1/path2/path5' },
   *   { path: 'path6', apps: [A, J, K], fullPath: '/path1/path2/path5/path6' },
   *   { path: 'path7', apps: [A], fullPath: '/path1/path2/path5/path6/path7' },
   *   { path: 'path8', apps: [C], fullPath: '/path1/path2/path5/path6/path7/path8' },
   *   { path: 'path9', apps: [C, L], fullPath: '/path1/path2/path5/path6/path7/path8/path9' },
   * ]
   * ```
   *
   * 1. 计算得出第三行 path3 和 path5 不匹配，记录不匹配位置。
   * 2. 销毁阶段：先销毁 path3 及之下所有 route，再销毁 path3 之上多余的碎片应用。整个销毁顺序是 H -> B -> [F, G]（数组表示并行）。
   * 3. 渲染阶段：优先渲染主路由，再渲染碎片应用。因此应用的渲染顺序是 C -> I -> [J, K] -> L。
   *
   * #### 根部碎片路由销毁和渲染
   * 根部碎片路由的销毁和渲染较简单，只需要先销毁目标路由没有的应用，再渲染目标路由需要但当前没有渲染的应用。
   */
  render: (switcherContext: IAppSwitcherContext) => Promise<void>;

  /** 重置为初始状态 */
  restore: () => void;
}
