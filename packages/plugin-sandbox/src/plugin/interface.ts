import { createServiceSymbol, IPlugin } from '@versea/core';
import { AsyncSeriesHook } from '@versea/tapable';

import { LoadStyleHookContext } from '../source/style-loader/interface';

export const IPluginSandboxKey = createServiceSymbol('IPluginSandbox');

export interface IPluginSandbox extends IPlugin {
  isApplied: boolean;
}

declare module '@versea/core' {
  interface IConfig {
    /** 默认开启沙箱 */
    sandbox?: boolean;
  }

  interface IHooks {
    loadStyle: AsyncSeriesHook<LoadStyleHookContext>;
  }

  interface AppConfig {
    /** 开启沙箱 */
    sandbox?: boolean;
  }

  interface IApp {
    a?: string;
  }
}

declare module '@versea/plugin-source-entry' {
  interface IInternalApp {
    /** 开启沙箱 */
    _useSandbox?: boolean;
  }
}
