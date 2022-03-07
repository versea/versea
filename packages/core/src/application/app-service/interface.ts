import { IRouter } from '../../navigation/router/service';
import { createServiceSymbol } from '../../utils';
import { AppOptions, IApp } from '../app/service';

export const IAppServiceKey = createServiceSymbol('IAppService');

export interface IAppService {
  /**
   * 用于标记是否已经执行start
   */
  isStarted: boolean;

  registerApp: (options: AppOptions, router: IRouter) => IApp;

  getApp: (name: string) => IApp;

  /**
   * 应用注册后需要执行start方法，只能执行一次，标记versea 主应用start状态
   */
  start: (router: IRouter) => void;
}
