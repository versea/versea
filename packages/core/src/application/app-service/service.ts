/* eslint-disable @typescript-eslint/naming-convention */
import { VerseaError } from '@versea/shared';
import { inject, interfaces } from 'inversify';

import { IMatcherKey, IMatcher } from '../../navigation/matcher/service';
import { provide } from '../../provider';
import { IApp, IAppKey, AppOptions, IStatusEnum, IStatusEnumKey } from '../app/service';
import { IAppService, IAppServiceKey } from './interface';

export * from './interface';

@provide(IAppServiceKey)
export class AppService implements IAppService {
  protected apps: Map<string, IApp> = new Map();

  protected readonly _AppConstructor: interfaces.Newable<IApp>;

  protected readonly _matcher: IMatcher;

  protected readonly _StatusEnum: IStatusEnum;

  constructor(
    @inject(IAppKey) App: interfaces.Newable<IApp>,
    @inject(IMatcherKey) matcher: IMatcher,
    @inject(IStatusEnumKey) StatusEnum: IStatusEnum,
  ) {
    this._AppConstructor = App;
    this._matcher = matcher;
    this._StatusEnum = StatusEnum;
  }

  public registerApp(options: AppOptions): IApp {
    // @ts-expect-error 需要传入参数，但 inversify 这里的参数类型是 never
    const app = new this._AppConstructor(options, { StatusEnum: this._StatusEnum });
    this.apps.set(app.name, app);

    // 创建 routes
    if (options.routes?.length) {
      this._matcher.addRoutes(options.routes, app);
    }

    return app;
  }

  public getApp(name: string): IApp {
    const app = this.apps.get(name);
    if (!app) {
      throw new VerseaError(`Can not find app by name "${name}".`);
    }
    return app;
  }

  public async loadApp(name: string): Promise<IApp> {
    const app = this.getApp(name);
    await app.load();
    return Promise.resolve(app);
  }
}
