import { inject } from 'inversify';

import { IAppSwitcher, IAppSwitcherKey } from '../../app-switcher/app-switcher/service';
import { IRouterKey, IRouter } from '../../navigation/router/service';
import { provide } from '../../provider';
import { IAppService, IAppServiceKey } from '../app-service/service';
import { IApp, AppConfig } from '../app/service';
import { IAppController, IAppControllerKey } from './interface';

export * from './interface';

@provide(IAppControllerKey)
export class AppController implements IAppController {
  protected readonly _router: IRouter;

  protected readonly _appService: IAppService;

  protected readonly _appSwitcher: IAppSwitcher;

  constructor(
    @inject(IRouterKey) router: IRouter,
    @inject(IAppServiceKey) appService: IAppService,
    @inject(IAppSwitcherKey) appSwitcher: IAppSwitcher,
  ) {
    this._router = router;
    this._appService = appService;
    this._appSwitcher = appSwitcher;
  }

  public registerApp(config: AppConfig): IApp {
    return this._appService.registerApp(config, this._router, this._appSwitcher);
  }

  public registerApps(configList: AppConfig[]): IApp[] {
    return this._appService.registerApps(configList, this._router, this._appSwitcher);
  }

  public getApp(name: string): IApp {
    return this._appService.getApp(name);
  }
}
