import { createServiceSymbol, IPlugin } from '@versea/core';
import {} from '@versea/plugin-source-entry';

export const IPluginSandboxKey = createServiceSymbol('IPluginSandbox');

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IPluginSandbox extends IPlugin {}

declare module '@versea/core' {
  interface IConfig {
    /** 默认开启沙箱 */
    sandbox?: boolean;
  }

  interface AppConfig {
    /** 开启沙箱 */
    sandbox?: boolean;
  }

  interface IApp {
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
