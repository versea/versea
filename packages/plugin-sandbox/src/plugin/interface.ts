import { createServiceSymbol, IPlugin } from '@versea/core';
import { AsyncSeriesHook, SyncHook } from '@versea/tapable';

import { RewriteCSSRuleHookContext } from '../source/scoped-css/interface';
import { LoadScriptHookContext, RunScriptHookContext } from '../source/script-loader/interface';
import { LoadStyleHookContext } from '../source/style-loader/interface';

export const IPluginSandbox = createServiceSymbol('IPluginSandbox');

export interface IPluginSandbox extends IPlugin {
  isApplied: boolean;
}

declare module '@versea/core' {
  interface IConfig {
    /** 默认开启沙箱 */
    sandbox?: boolean;

    /** 开启样式作用域 */
    scopedCSS?: boolean;
  }

  interface IHooks {
    /** 沙箱环境加载 style */
    loadStyle: AsyncSeriesHook<LoadStyleHookContext>;

    /** 重写 CSSRule */
    rewriteCSSRule: SyncHook<RewriteCSSRuleHookContext>;

    /** 沙箱环境加载 script */
    loadScript: AsyncSeriesHook<LoadScriptHookContext>;

    /** 沙箱环境执行 script */
    runScript: AsyncSeriesHook<RunScriptHookContext>;
  }

  interface AppConfig {
    /** 开启沙箱 */
    sandbox?: boolean;

    /** 开启样式作用域 */
    scopedCSS?: boolean;

    /** 样式选择器前缀 */
    selectorPrefix?: string;
  }
}

declare module '@versea/plugin-source-entry' {
  interface IInternalApp {
    /** 开启沙箱 */
    _useSandbox?: boolean;

    /** 开启样式作用域 */
    _scopedCSS?: boolean;

    /** 样式选择器前缀 */
    _selectorPrefix?: string;
  }
}
