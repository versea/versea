import { createServiceSymbol, IPlugin } from '@versea/core';
import { AsyncSeriesHook, SyncHook } from '@versea/tapable';

import { ISandbox } from '../sandbox/sandbox/interface';
import { RewriteCSSRuleHookContext } from '../source/scoped-css/interface';
import {
  LoadDynamicScriptHookContext,
  LoadScriptHookContext,
  ProcessScripCodeHookContext,
  RunScriptHookContext,
} from '../source/script-loader/interface';
import { LoadDynamicStyleHookContext, LoadStyleHookContext } from '../source/style-loader/interface';

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

    /**
     * 是否永久缓存资源代码
     * @description 不永久缓存资源文件则执行完成资源文件后回删除缓存，并且动态增加的资源不会进入缓存
     */
    isPersistentSourceCode?: boolean;
  }

  interface IHooks {
    /** 沙箱环境加载 style，不包含动态加载 */
    loadStyle: AsyncSeriesHook<LoadStyleHookContext>;

    /** 沙箱环境加载动态样式（仅仅包含 link 元素，不包含动态添加 style 元素） */
    loadDynamicStyle: AsyncSeriesHook<LoadDynamicStyleHookContext>;

    /** 重写 CSSRule */
    rewriteCSSRule: SyncHook<RewriteCSSRuleHookContext>;

    /** 沙箱环境加载 script，不包含动态加载 */
    loadScript: AsyncSeriesHook<LoadScriptHookContext>;

    /** 沙箱环境加载动态脚本（不包含行内脚本） */
    loadDynamicScript: AsyncSeriesHook<LoadDynamicScriptHookContext>;

    /**
     * 沙箱环境执行 script
     * @description 执行动态 InlineScript 时，会忽略 PLUGIN_SANDBOX_TAP 之前的监听，如果希望在动态 InlineScript 之前增加监听，可以使用 beforeRunDynamicInlineScript
     */
    runScript: AsyncSeriesHook<RunScriptHookContext>;

    /** 执行动态 InlineScript 之前 */
    beforeRunDynamicInlineScript: SyncHook<RunScriptHookContext>;

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

    /**
     * 是否永久缓存资源代码
     * @description 不永久缓存资源文件则执行完成资源文件后回删除缓存，并且动态增加的资源不会进入缓存
     */
    isPersistentSourceCode?: boolean;
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

    /**
     * 是否永久缓存资源代码
     * @description 不永久缓存资源文件则执行完成资源文件后回删除缓存，并且动态增加的资源不会进入缓存
     */
    _isPersistentSourceCode?: boolean;
  }
}
