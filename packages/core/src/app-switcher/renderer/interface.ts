import { MatchedRoutes } from '../../navigation/matcher/service';
import { MatchedRoute } from '../../navigation/route/service';
import { createServiceSymbol } from '../../utils';
import { RendererActionHandler } from './action';

export const IRendererKey = createServiceSymbol('IRenderer');

export interface IRenderer {
  /** 当前正在运行的路由和应用 */
  routes: MatchedRoute[];

  /** 当前正在运行的顶层碎片路由和碎片应用 */
  rootFragments: MatchedRoute[];

  /**
   * 计算和执行渲染逻辑
   * @description 根据 matched 计算出 unmount 和 mount 的应用和顺序
   */
  render: (matchedRoutes: MatchedRoutes, onAction: RendererActionHandler) => Promise<void>;
}
