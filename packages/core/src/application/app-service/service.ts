import { inject, interfaces } from 'inversify';

import { IRouteTreesKey, IRouteTrees } from '../../navigation/route-trees/service';
import { provide } from '../../provider';
import { IApp, IAppKey, AppOptions } from '../app/service';
import { IAppService, IAppServiceKey } from './interface';

export * from './interface';

@provide(IAppServiceKey)
export class AppService implements IAppService {
  public apps: Map<string, IApp> = new Map();

  // eslint-disable-next-line @typescript-eslint/naming-convention
  protected readonly _AppConstructor: interfaces.Newable<IApp>;

  protected readonly _routeTrees: IRouteTrees;

  // eslint-disable-next-line @typescript-eslint/naming-convention
  constructor(@inject(IAppKey) App: interfaces.Newable<IApp>, @inject(IRouteTreesKey) routeTrees: IRouteTrees) {
    this._AppConstructor = App;
    this._routeTrees = routeTrees;
  }

  public registerApplication(options: AppOptions): IApp {
    // @ts-expect-error 需要传入参数，但 inversify 这里的参数类型是 never
    const app = new this._AppConstructor(options);
    this.apps.set(app.name, app);

    // 创建 routes
    if (options.routes?.length) {
      this._routeTrees.createTree(options.routes, app);
    }

    return app;
  }
}
