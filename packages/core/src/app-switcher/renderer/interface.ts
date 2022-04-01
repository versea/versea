import { Matched } from '../../navigation/matcher/service';
import { MatchedRoute } from '../../navigation/route/service';
import { createServiceSymbol } from '../../utils';

export const IRendererKey = createServiceSymbol('IRenderer');

export interface IRenderer {
  /** 匹配的路由信息 */
  routes: MatchedRoute[];

  /** 匹配的顶层碎片路由信息 */
  fragments: MatchedRoute[];

  /**
   * 计算和执行渲染逻辑
   * @description 根据 target 计算出 unmount 和 mount 的应用和顺序
   */
  render: (matched: Matched, onAction: ActionHandler) => Promise<void>;
}

/** 事件处理函数 */
// TODO: 定义 Action
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ActionHandler = (action: any) => Promise<void>;
