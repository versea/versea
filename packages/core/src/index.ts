export type { IAppSwitcher, SwitcherOptions } from './app-switcher/app-switcher/service';
export { IAppSwitcherKey, AppSwitcher } from './app-switcher/app-switcher/service';
export type {
  IAppSwitcherContext,
  RunOptions,
  AppSwitcherContextDependencies,
} from './app-switcher/app-switcher-context/service';
export { IAppSwitcherContextKey, AppSwitcherContext } from './app-switcher/app-switcher-context/service';
export type { ILoader } from './app-switcher/loader/service';
export { ILoaderKey, Loader } from './app-switcher/loader/service';
export type { ILoaderHookContext, LoaderHookContextOptions } from './app-switcher/loader-hook-context/service';
export { ILoaderHookContextKey, LoaderHookContext } from './app-switcher/loader-hook-context/service';
export type { IRenderer } from './app-switcher/renderer/service';
export { IRendererKey, Renderer } from './app-switcher/renderer/service';
export type {
  IRendererHookContext,
  RendererHookContextOptions,
  RendererHookContextDependencies,
} from './app-switcher/renderer-hook-context/service';
export { IRendererHookContextKey, RendererHookContext } from './app-switcher/renderer-hook-context/service';
export type { IRouteState } from './app-switcher/route-state/service';
export { IRouteStateKey, RouteState } from './app-switcher/route-state/service';

export type {
  IApp,
  AppConfig,
  AppConfigProps,
  AppLifeCycleFunction,
  AppLifeCycles,
  AppProps,
  AppDependencies,
} from './application/app/service';
export { IAppKey, App } from './application/app/service';
export type { IAppService, RegisterAppHookContext } from './application/app-service/service';
export { IAppServiceKey, AppService } from './application/app-service/service';

export type { IStatus, ISwitcherStatus } from './enum/status';
export { IStatusKey, ISwitcherStatusKey } from './enum/status';

export type { IHooks } from './hooks/service';
export { IHooksKey, Hooks } from './hooks/service';

export type {
  IMatcher,
  MatchRouteHookContext,
  MatchRoutesHookContext,
  MatchedResult,
} from './navigation/matcher/service';
export { IMatcherKey, Matcher } from './navigation/matcher/service';
export type {
  IRoute,
  RouteConfig,
  RouteMeta,
  ToMatchedRouteOptions,
  PathToRegexpOptions,
  MatchedRoute,
} from './navigation/route/service';
export { IRouteKey, Route } from './navigation/route/service';
export type { IRouter, RerouteHookContext } from './navigation/router/service';
export { IRouterKey, Router } from './navigation/router/service';

export * from './provider';

export type { IStarter } from './starter/service';
export { IStarterKey, Starter } from './starter/service';

export type { IConfig } from './config';
export { IConfigKey } from './config';
export * from './constants';
export type { IPlugin } from './plugin';
export { createServiceSymbol } from './utils';
