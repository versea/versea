export type { SwitcherOptions } from './app-switcher/app-switcher/service';
export { IAppSwitcher, AppSwitcher } from './app-switcher/app-switcher/service';
export type { RunOptions, AppSwitcherContextDependencies } from './app-switcher/app-switcher-context/service';
export { IAppSwitcherContext, AppSwitcherContext } from './app-switcher/app-switcher-context/service';
export { ILoader, Loader } from './app-switcher/loader/service';
export type { LoaderHookContextOptions } from './app-switcher/loader-hook-context/service';
export { ILoaderHookContext, LoaderHookContext } from './app-switcher/loader-hook-context/service';
export { IRenderer, Renderer } from './app-switcher/renderer/service';
export type {
  RendererHookContextOptions,
  RendererHookContextDependencies,
} from './app-switcher/renderer-hook-context/service';
export { IRendererHookContext, RendererHookContext } from './app-switcher/renderer-hook-context/service';
export { IRouteState, RouteState } from './app-switcher/route-state/service';

export type {
  AppConfig,
  AppConfigProps,
  AppLifeCycleFunction,
  AppLifeCycles,
  AppProps,
  AppDependencies,
} from './application/app/service';
export { IApp, App } from './application/app/service';
export type { RegisterAppHookContext } from './application/app-service/service';
export { IAppService, AppService } from './application/app-service/service';

export { IStatus, ISwitcherStatus } from './enum/status';

export { IHooks, Hooks } from './hooks/service';

export type { MatchRouteHookContext, MatchRoutesHookContext, MatchedResult } from './navigation/matcher/service';
export { IMatcher, Matcher } from './navigation/matcher/service';
export type {
  RouteConfig,
  RouteMeta,
  ToMatchedRouteOptions,
  PathToRegexpOptions,
  MatchedRoute,
} from './navigation/route/service';
export { IRoute, Route } from './navigation/route/service';
export type { RerouteHookContext } from './navigation/router/service';
export { IRouter, Router } from './navigation/router/service';

export * from './provider';

export { IStarter, Starter } from './starter/service';

export { IConfig } from './config';
export * from './constants';
export type { IPlugin } from './plugin';
export { createServiceSymbol } from './utils';
