import { createServiceSymbol, IPlugin } from '@versea/core';
import {} from '@versea/plugin-source-entry';

export const IPluginSandboxKey = createServiceSymbol('IPluginSandbox');

export interface IPluginSandbox extends IPlugin {
  isApplied: boolean;
}

declare module '@versea/core' {
  interface IConfig {
    /** 默认开启沙箱 */
    sandbox?: boolean;
  }

  interface AppConfig {
    /** 开启沙箱 */
    sandbox?: boolean;
  }
}

declare module '@versea/plugin-source-entry' {
  interface IInternalApp {
    /** 开启沙箱 */
    _useSandbox?: boolean;
  }
}
