import { createServiceSymbol } from '../../utils';
import { AppOptions, IApp } from '../app/service';

export const IAppControllerKey = createServiceSymbol('IAppController');

export interface IAppController {
  /**
   * 注册应用
   */
  registerApp: (options: AppOptions) => IApp;

  /**
   * 获取已经注册的应用
   */
  getApp: (name: string) => IApp;

  /**
   * 注册应用后需要执行start，标记状态
   */
  start: () => void;
}
