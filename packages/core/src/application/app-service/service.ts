/* eslint-disable @typescript-eslint/naming-convention */
import { VerseaError } from '@versea/shared';
import { inject, interfaces } from 'inversify';

import { IStatusEnum, IStatusEnumKey } from '../../constants/status';
import { IRouter } from '../../navigation/router/service';
import { provide } from '../../provider';
import { IApp, IAppKey, AppOptions } from '../app/service';
import { IAppService, IAppServiceKey } from './interface';

export * from './interface';

@provide(IAppServiceKey)
export class AppService implements IAppService {
  public isStarted = false;

  protected appMap: Map<string, IApp> = new Map();

  protected readonly _AppConstructor: interfaces.Newable<IApp>;

  protected readonly _StatusEnum: IStatusEnum;

  constructor(@inject(IAppKey) App: interfaces.Newable<IApp>, @inject(IStatusEnumKey) StatusEnum: IStatusEnum) {
    this._AppConstructor = App;
    this._StatusEnum = StatusEnum;
  }

  public registerApp(options: AppOptions, router: IRouter): IApp {
    if (this.appMap.has(options.name)) {
      throw new VerseaError(`Duplicate app name: "${options.name}".`);
    }

    // @ts-expect-error 需要传入参数，但 inversify 这里的参数类型是 never
    const app = new this._AppConstructor(options, { StatusEnum: this._StatusEnum });
    this.appMap.set(app.name, app);

    // 创建 routes
    if (options.routes?.length) {
      router.addRoutes(options.routes, app);
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

  public start(router: IRouter): void {
    this.isStarted = true;
    router.reroute();
  }
}
