import { createServiceSymbol } from '../../utils';
import { AppOptions, IApp } from '../app/service';

export const IAppControllerKey = createServiceSymbol('IAppController');

export interface IAppController {
  /** 注册应用 */
  registerApp: (options: AppOptions) => IApp;

  /** 注册多个应用 */
  registerApps: (optionsList: AppOptions[]) => IApp[];

  /** 获取所有已经注册的应用 */
  getApp: (name: string) => IApp;
}
