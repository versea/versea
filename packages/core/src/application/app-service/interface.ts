import { IRouter } from '../../navigation/router/service';
import { createServiceSymbol } from '../../utils';
import { AppOptions, IApp } from '../app/service';

export const IAppServiceKey = createServiceSymbol('IAppService');

export interface IAppService {
  /**
   * 是否已经执行 start
   */
  isStarted: boolean;

  registerApp: (options: AppOptions, router: IRouter) => IApp;

  getApp: (name: string) => IApp;

  start: (router: IRouter) => void;
}
