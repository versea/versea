import { createServiceSymbol, IPlugin } from '@versea/core';
import { AsyncSeriesHook, SyncHook } from '@versea/tapable';

import { ISandbox } from '../sandbox/sandbox/interface';
import { RewriteCSSRuleHookContext } from '../source/scoped-css/interface';
import {
  LoadScriptHookContext,
  ProcessScripCodeHookContext,
  RunScriptHookContext,
} from '../source/script-loader/interface';
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

    /** 沙箱环境下生成代码 */
    processScriptCode: SyncHook<ProcessScripCodeHookContext>;
  }

  interface AppConfig {
    /** 开启沙箱 */
    sandbox?: boolean;

    /** 开启样式作用域 */
    scopedCSS?: boolean;

    /** 样式选择器前缀 */
    selectorPrefix?: string;

    /** 使用 inlineScript 执行代码 */
    inlineScript?: boolean;
  }

  interface IApp {
    sandbox?: ISandbox;
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

    /** 使用 inlineScript 执行代码 */
    _inlineScript?: boolean;
  }
}
