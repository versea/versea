/* eslint-disable @typescript-eslint/naming-convention */
import { VerseaError } from '@versea/shared';
import { inject, interfaces } from 'inversify';

import { IStatus, IStatusKey } from '../../enum/status';
import { IHooks, IHooksKey } from '../../hooks/interface';
import { IRouter, IRouterKey } from '../../navigation/router/interface';
import { provide, lazyInject } from '../../provider';
import { IApp, IAppKey, AppConfig } from '../app/interface';
import { IAppService, IAppServiceKey, RegisterAppHookContext } from './interface';

export * from './interface';

@provide(IAppServiceKey)
export class AppService implements IAppService {
  @lazyInject(IRouterKey) protected readonly _router!: IRouter;

  /** App 实例的 Map */
  protected readonly _appMap: Map<string, IApp> = new Map();

  protected readonly _AppConstructor: interfaces.Newable<IApp>;

  protected readonly _Status: IStatus;

  protected readonly _hooks: IHooks;

  constructor(
    @inject(IAppKey) App: interfaces.Newable<IApp>,
    @inject(IStatusKey) Status: IStatus,
    @inject(IHooksKey) hooks: IHooks,
  ) {
    this._AppConstructor = App;
    this._Status = Status;
    this._hooks = hooks;
  }

  public registerApp(config: AppConfig, reroute = true): IApp {
    if (this._appMap.has(config.name)) {
      throw new VerseaError(`Duplicate app name: "${config.name}".`);
    }
    const { beforeRegisterApp, afterRegisterApp } = this._hooks;
    const registerAppHookContext: RegisterAppHookContext = { config };
    beforeRegisterApp.call(registerAppHookContext);

    // @ts-expect-error 需要传入参数，但 inversify 这里的参数类型是 never
    const app = new this._AppConstructor(registerAppHookContext.config, { Status: this._Status });
    this._appMap.set(app.name, app);

    registerAppHookContext.app = app;
    afterRegisterApp.call(registerAppHookContext);

    if (config.routes?.length) {
      this._router.addRoutes(config.routes, app);
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

  public getApp(name: string): IApp {
    const app = this._appMap.get(name);
    if (!app) {
      throw new VerseaError(`Can not find app by name "${name}".`);
    }
    return app;
  }
}
