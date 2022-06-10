import { HookContext } from '@versea/tapable';

import { createServiceSymbol } from '../../utils';
import { AppConfig, IApp } from '../app/interface';

export const IAppService = createServiceSymbol('IAppService');

export interface IAppService {
  /** 注册应用 */
  registerApp: (config: AppConfig, reroute?: boolean) => IApp;

  /** 注册多个应用 */
  registerApps: (configList: AppConfig[]) => IApp[];

  /** 根据应用名称获取应用实例 */
  getApp: (name: string) => IApp | undefined;

  /** 判断是否具有该应用实例 */
  hasApp: (name: string) => boolean;
}

export interface RegisterAppHookContext extends HookContext {
  config: AppConfig;
  app?: IApp;
}
