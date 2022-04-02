import { IApp } from '../../application/app/service';
import { IActionType, IActionTargetType } from '../../constants/action';
import { MatchedRoute } from '../../navigation/route/service';

export interface RendererAction {
  type: IActionType[keyof IActionType];
  targetType: IActionTargetType[keyof IActionTargetType];
  apps?: IApp[];
  route?: MatchedRoute;
  targetRoute?: MatchedRoute;
}

/** 事件处理函数 */
export type RendererActionHandler = (action: RendererAction) => Promise<void>;
