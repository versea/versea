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
   * 启动应用，注册完成所有应用后需要调用一次这个方法
   * @description 未启动应用时，路由匹配之后仅仅会 load App，而不会 mount App；启动应用之后，路由匹配后 load & mount App
   */
  start: () => void;
}
