import { createServiceSymbol } from '../../utils';
import { AppConfig, IApp } from '../app/service';

export const IAppControllerKey = createServiceSymbol('IAppController');

export interface IAppController {
  /** 注册应用 */
  registerApp: (config: AppConfig) => IApp;

  /** 注册多个应用 */
  registerApps: (configList: AppConfig[]) => IApp[];

  /** 根据应用名称获取应用实例 */
  getApp: (name: string) => IApp;
}
