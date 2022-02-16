/* eslint-disable @typescript-eslint/naming-convention */
import { VerseaError } from '@versea/shared';
import { inject, interfaces } from 'inversify';

import { IStatusEnum, IStatusEnumKey } from '../../constants/status';
import { IRouterKey, IRouter } from '../../navigation/router/service';
import { provide } from '../../provider';
import { IApp, IAppKey, AppOptions } from '../app/service';
import { IAppService, IAppServiceKey } from './interface';

export * from './interface';

@provide(IAppServiceKey)
export class AppService implements IAppService {
  protected appMap: Map<string, IApp> = new Map();

  protected readonly _AppConstructor: interfaces.Newable<IApp>;

  protected readonly _router: IRouter;

  protected readonly _StatusEnum: IStatusEnum;

  constructor(
    @inject(IAppKey) App: interfaces.Newable<IApp>,
    @inject(IRouterKey) router: IRouter,
    @inject(IStatusEnumKey) StatusEnum: IStatusEnum,
  ) {
    this._AppConstructor = App;
    this._router = router;
    this._StatusEnum = StatusEnum;
  }

  public registerApp(options: AppOptions): IApp {
    if (this.appMap.has(options.name)) {
      throw new VerseaError(`Duplicate app name: "${options.name}".`);
    }

    // @ts-expect-error 需要传入参数，但 inversify 这里的参数类型是 never
    const app = new this._AppConstructor(options, { StatusEnum: this._StatusEnum });
    this.appMap.set(app.name, app);

    // 创建 routes
    if (options.routes?.length) {
      this._router.addRoutes(options.routes, app);
    }

    return app;
  }

  public getApp(name: string): IApp {
    const app = this.appMap.get(name);
    if (!app) {
      throw new VerseaError(`Can not find app by name "${name}".`);
    }
    return app;
  }
}
