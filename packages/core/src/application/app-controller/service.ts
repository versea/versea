import { inject } from 'inversify';

import { IRouterKey, IRouter } from '../../navigation/router/service';
import { provide } from '../../provider';
import { IAppService, IAppServiceKey } from '../app-service/service';
import { IApp, AppOptions } from '../app/service';
import { IAppController, IAppControllerKey } from './interface';

export * from './interface';

@provide(IAppControllerKey)
export class AppController implements IAppController {
  protected readonly _router: IRouter;

  protected readonly _appService: IAppService;

  constructor(@inject(IRouterKey) router: IRouter, @inject(IAppServiceKey) appService: IAppService) {
    this._router = router;
    this._appService = appService;
  }

  public registerApp(options: AppOptions): IApp {
    return this._appService.registerApp(options, this._router);
  }

  public getApp(name: string): IApp {
    return this._appService.getApp(name);
  }
}
