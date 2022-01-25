import { inject, interfaces } from 'inversify';

import { IRoutesTreeKey, IRoutesTree } from '../../navigation/routes-tree/service';
import { provide } from '../../provider';
import { IApp, IAppKey, AppOptions } from '../app/service';
import { IAppService, IAppServiceKey } from './interface';

export * from './interface';

@provide(IAppServiceKey)
export class AppService implements IAppService {
  public apps: Map<string, IApp> = new Map();

  private readonly _AppConstructor: interfaces.Newable<IApp>;

  private readonly _routesTree: IRoutesTree;

  // eslint-disable-next-line @typescript-eslint/naming-convention
  constructor(@inject(IAppKey) App: interfaces.Newable<IApp>, @inject(IRoutesTreeKey) routesTree: IRoutesTree) {
    this._AppConstructor = App;
    this._routesTree = routesTree;
  }

  public registerApplication(options: AppOptions): IApp {
    // @ts-expect-error 需要传入参数，但 inversify 这里的参数类型是 never
    const app = new this._AppConstructor(options);
    this.apps.set(app.name, app);

    // 创建 routes
    if (options.routes?.length) {
      this._routesTree.createTree(options.routes, app);
    }

    return app;
  }
}
