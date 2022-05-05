import {
  AppConfig,
  buildProviderModule,
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
} from '@versea/core';
import { Container } from 'inversify';

export * from '@versea/core';

export interface IVerseaPlugin {
  apply: (container: Container) => void;
}

export class Versea {
  public container: Container;

  constructor(config: Partial<IConfig> = {}) {
    provideValue(config, IConfigKey);
    this.container = new Container({ defaultScope: 'Singleton' });
    this.container.load(buildProviderModule(this.container));
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
  public use(plugin: IVerseaPlugin | string | symbol | ((container: Container) => void)): void {
    if (typeof plugin === 'function') {
      plugin(this.container);
      return;
    }

    if (typeof plugin === 'object') {
      plugin.apply(this.container);
      return;
    }

    if (typeof plugin === 'string' || typeof plugin === 'symbol') {
      this.container.get<IPlugin>(plugin).apply();
      return;
    }
  }
}
