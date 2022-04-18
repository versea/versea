import { createServiceSymbol } from '../../utils';
import { AppConfig, IApp } from '../app/service';

export const IAppServiceKey = createServiceSymbol('IAppService');

export interface IAppService {
  /** 注册应用 */
  registerApp: (config: AppConfig, reroute?: boolean) => IApp;

  /** 注册多个应用 */
  registerApps: (configList: AppConfig[]) => IApp[];

  /** 根据应用名称获取应用实例 */
  getApp: (name: string) => IApp;
}
