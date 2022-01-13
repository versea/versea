import { inject, interfaces } from 'inversify';

import { provide } from '../../provider';
import { IApp, IAppKey, AppOptions } from '../app/service';
import { IAppService, IAppServiceKey } from './interface';

export * from './interface';

@provide(IAppServiceKey)
export class AppService implements IAppService {
  private readonly _AppConstructor: interfaces.Newable<IApp>;

  // eslint-disable-next-line @typescript-eslint/naming-convention
  constructor(@inject(IAppKey) App: interfaces.Newable<IApp>) {
    this._AppConstructor = App;
  }

  public registerApplication(options: AppOptions): IApp {
    // @ts-expect-error 需要传入参数，但 inversify 这里的参数类型是 never
    const app = new this._AppConstructor(options);
    return app;
  }
}
