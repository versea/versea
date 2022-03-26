import { IAppSwitcher } from '../../app-switcher/app-switcher/service';
import { IRouter } from '../../navigation/router/service';
import { createServiceSymbol } from '../../utils';
import { AppOptions, IApp } from '../app/service';

export const IAppServiceKey = createServiceSymbol('IAppService');

export interface IAppService {
  /** 注册应用 */
  registerApp: (options: AppOptions, router: IRouter, appSwitcher?: IAppSwitcher) => IApp;

  /** 注册多个应用 */
  registerApps: (appOptionsList: AppOptions[], router: IRouter, appSwitcher: IAppSwitcher) => IApp[];

  /** 获取所有已经注册的应用 */
  getApp: (name: string) => IApp;
}
