import { IApp } from '../../application/app/service';
import { IActionType, IActionTargetType } from '../../constants/action';

export interface LoaderAction {
  type: IActionType[keyof IActionType];
  targetType: IActionTargetType[keyof IActionTargetType];
  apps?: IApp[];
}

/** 事件处理函数 */
export type LoaderActionHandler = (action: LoaderAction) => Promise<void>;
