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

export class Versea {
  public container: Container;

  constructor(config: Partial<IConfig> = {}) {
    provideValue(config, IConfigKey);
    this.container = new Container({ defaultScope: 'Singleton' });
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
  /* eslint-disable @typescript-eslint/no-explicit-any */
  /* eslint-disable @typescript-eslint/no-unsafe-member-access */
  /* eslint-disable @typescript-eslint/no-unsafe-call */
  public use(plugin: object | ((container: Container) => void)): void;
  public use(plugin: string | symbol, config?: Partial<IConfig>): void;
  public use(plugin: object | string | symbol, config?: Partial<IConfig>): void {
    if (typeof plugin === 'function') {
      plugin(this);
      return;
    }

    if (typeof plugin === 'object') {
      (plugin as any).apply(this);
      return;
    }

    if (typeof plugin === 'symbol' || typeof plugin === 'string') {
      if (config) {
        provideValue(config, IConfigKey);
      }
      const pluginService = this.container.get(plugin);
      (pluginService as any).apply();
    }
  }
  /* eslint-enable @typescript-eslint/no-explicit-any */
  /* eslint-enable @typescript-eslint/no-unsafe-member-access */
  /* eslint-enable @typescript-eslint/no-unsafe-call */
}
