import {
  AppConfig,
  buildProviderModule,
  getMappingSymbol,
  IApp,
  IAppService,
  IAppServiceKey,
  IConfig,
  IConfigKey,
  IHooks,
  IHooksKey,
  IPlugin,
  IRouter,
  IRouterKey,
  IRouteState,
  IRouteStateKey,
  IStarter,
  IStarterKey,
  provideValue,
  VerseaContainer,
} from '@versea/core';

export * from '@versea/core';

export interface IVerseaPlugin {
  apply: (container: VerseaContainer) => void;
}

export class Versea {
  public container: VerseaContainer;

  constructor(config: Partial<IConfig> = {}) {
    provideValue(config, IConfigKey);
    this.container = new VerseaContainer({ defaultScope: 'Singleton' });
    this.container.load(buildProviderModule());
  }

  public get appService(): IAppService {
    return this.container.get<IAppService>(IAppServiceKey);
  }

  public get hooks(): IHooks {
    return this.container.get<IHooks>(IHooksKey);
  }

  public get router(): IRouter {
    return this.container.get<IRouter>(IRouterKey);
  }

  public get routeState(): IRouteState {
    return this.container.get<IRouteState>(IRouteStateKey);
  }

  public get starter(): IStarter {
    return this.container.get<IStarter>(IStarterKey);
  }

  public registerApp(config: AppConfig): IApp {
    return this.appService.registerApp(config);
  }

  public registerApps(configList: AppConfig[]): IApp[] {
    return this.appService.registerApps(configList);
  }

  public async start(): Promise<void> {
    return this.starter.start();
  }

  public async reroute(navigationEvent?: Event): Promise<void> {
    return this.router.reroute(navigationEvent);
  }

  /** 使用插件 */
  public use(plugin: IVerseaPlugin | ((container: VerseaContainer) => void)): void;
  public use(plugin: string | symbol, config?: Record<string, unknown>): void;
  public use(
    plugin: IVerseaPlugin | string | symbol | ((container: VerseaContainer) => void),
    config?: Record<string, unknown>,
  ): void {
    if (typeof plugin === 'function') {
      plugin(this.container);
      return;
    }

    if (typeof plugin === 'object') {
      plugin.apply(this.container);
      return;
    }

    if (typeof plugin === 'string') {
      this.container.get<IPlugin>(plugin).apply();
      return;
    }

    if (typeof plugin === 'symbol') {
      const mappingSymbol = getMappingSymbol(plugin);
      if (config && mappingSymbol) {
        provideValue(config, mappingSymbol);
      }
      this.container.get<IPlugin>(plugin).apply();
    }
  }
}
