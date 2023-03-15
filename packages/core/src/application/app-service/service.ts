/* eslint-disable @typescript-eslint/naming-convention */
import { logWarn, VerseaError } from '@versea/shared';
import { inject, interfaces } from 'inversify';

import { IConfig } from '../../config';
import { IStatus } from '../../enum/status';
import { IHooks } from '../../hooks/interface';
import { IRouter } from '../../navigation/router/interface';
import { provide, lazyInject } from '../../provider';
import { IApp, AppConfig } from '../app/interface';
import { IAppService, RegisterAppHookContext } from './interface';

export * from './interface';

@provide(IAppService)
export class AppService implements IAppService {
  @lazyInject(IRouter) protected readonly _router!: IRouter;

  /** App 实例的 Map */
  protected readonly _appMap: Map<string, IApp> = new Map();

  protected readonly _AppConstructor: interfaces.Newable<IApp>;

  protected readonly _Status: IStatus;

  protected readonly _hooks: IHooks;

  protected _config: IConfig;

  protected readonly _rootParcels: IApp[] = [];

  constructor(
    @inject(IApp) App: interfaces.Newable<IApp>,
    @inject(IStatus) Status: IStatus,
    @inject(IHooks) hooks: IHooks,
    @inject(IConfig) config: IConfig,
  ) {
    this._AppConstructor = App;
    this._Status = Status;
    this._hooks = hooks;
    this._config = config;
  }

  public registerApp(config: AppConfig, reroute = true): IApp {
    if (this._appMap.has(config.name)) {
      throw new VerseaError(`Duplicate app name: "${config.name}".`);
    }

    const { beforeRegisterApp, afterRegisterApp } = this._hooks;
    const registerAppHookContext: RegisterAppHookContext = { config };
    beforeRegisterApp.call(registerAppHookContext);

    // @ts-expect-error 需要传入参数，但 inversify 这里的参数类型是 never
    const app = new this._AppConstructor(registerAppHookContext.config, {
      Status: this._Status,
      appService: this,
      hooks: this._hooks,
      config: this._config,
    });

    this._appMap.set(app.name, app);

    registerAppHookContext.app = app;
    afterRegisterApp.call(registerAppHookContext);

    if (registerAppHookContext.config.routes?.length) {
      this._router.addRoutes(registerAppHookContext.config.routes, app);
    }

    if (reroute) {
      void this._router.reroute();
    }

    return app;
  }

  public registerApps(configList: AppConfig[]): IApp[] {
    const apps = configList.map((config) => this.registerApp(config, false));
    void this._router.reroute();
    return apps;
  }

  public registerRootParcel(config: AppConfig): IApp {
    if (this._appMap.has(config.name)) {
      logWarn(`Parcel "${config.name}" has been registered.`);
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return this._appMap.get(config.name)!;
    }

    const app = this.registerApp(config, false);
    this._rootParcels.push(app);
    return app;
  }

  public hasApp(name: string): boolean {
    return this._appMap.has(name);
  }

  public getApp(name: string): IApp | undefined {
    return this._appMap.get(name);
  }
}
