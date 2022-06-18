export { ICurrentApp, CurrentApp } from './current-app/service';

export { IElementPatch, ElementPatch } from './element-patch/service';

export { IPluginSandbox, PluginSandbox } from './plugin/service';

export { IDocumentEffect, DocumentEffect } from './sandbox/document-effect/service';
export type { SandboxOptions, SandboxDependencies } from './sandbox/sandbox/service';
export { ISandbox, Sandbox } from './sandbox/sandbox/service';
export type { VerseaAppWindow } from './sandbox/sandbox/types';
export type { SandboxEffectOptions, SandboxEffectDependencies } from './sandbox/sandbox-effect/service';
export { ISandboxEffect, SandboxEffect } from './sandbox/sandbox-effect/service';
export type { WindowEffectOptions } from './sandbox/window-effect/service';
export { IWindowEffect, WindowEffect } from './sandbox/window-effect/service';

export { ILoadEvent, LoadEvent } from './source/load-event/service';
export type { RewriteCSSRuleHookContext } from './source/scoped-css/service';
export { IScopedCSS, ScopedCSS } from './source/scoped-css/service';
export type {
  LoadScriptHookContext,
  RunScriptHookContext,
  ProcessScripCodeHookContext,
  LoadDynamicScriptHookContext,
} from './source/script-loader/service';
export { IScriptLoader, ScriptLoader } from './source/script-loader/service';
export type { LoadStyleHookContext, LoadDynamicStyleHookContext } from './source/style-loader/service';
export { IStyleLoader } from './source/style-loader/service';

export * from './constants';
export { globalEnv } from './global-env';
