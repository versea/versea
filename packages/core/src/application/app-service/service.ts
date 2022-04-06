/* eslint-disable @typescript-eslint/naming-convention */
import { VerseaError } from '@versea/shared';
import { inject, interfaces } from 'inversify';

import { IAppSwitcher } from '../../app-switcher/app-switcher/service';
import { IStatus, IStatusKey } from '../../constants/status';
import { IRouter } from '../../navigation/router/service';
import { provide } from '../../provider';
import { IApp, IAppKey, AppConfig } from '../app/service';
import { IAppService, IAppServiceKey } from './interface';

export * from './interface';

@provide(IAppServiceKey)
export class AppService implements IAppService {
  /** App 实例的 Map */
  protected readonly _appMap: Map<string, IApp> = new Map();

  protected readonly _AppConstructor: interfaces.Newable<IApp>;

  protected readonly _Status: IStatus;

  constructor(@inject(IAppKey) App: interfaces.Newable<IApp>, @inject(IStatusKey) Status: IStatus) {
    this._AppConstructor = App;
    this._Status = Status;
  }

  public registerApp(config: AppConfig, router: IRouter, appSwitcher?: IAppSwitcher): IApp {
    if (this._appMap.has(config.name)) {
      throw new VerseaError(`Duplicate app name: "${config.name}".`);
    }

    // @ts-expect-error 需要传入参数，但 inversify 这里的参数类型是 never
    const app = new this._AppConstructor(config, { Status: this._Status });
    this._appMap.set(app.name, app);

    // 创建 routes
    if (config.routes?.length) {
      router.addRoutes(config.routes, app);
    }

    if (appSwitcher) {
      void router.reroute(appSwitcher);
    }

    return app;
  }

  public registerApps(configList: AppConfig[], router: IRouter, appSwitcher: IAppSwitcher): IApp[] {
    const apps = configList.map((config) => this.registerApp(config, router));
    void router.reroute(appSwitcher);
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
