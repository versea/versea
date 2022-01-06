import { inject, injectable, interfaces } from 'inversify';
import { IApp, IAppKey, AppProps } from '../app/service';
import { IAppService } from './interface';

export * from './interface';

@injectable()
export class AppService implements IAppService {
  private readonly _AppConstructor: interfaces.Newable<IApp>;

  // eslint-disable-next-line @typescript-eslint/naming-convention
  constructor(@inject(IAppKey) App: interfaces.Newable<IApp>) {
    this._AppConstructor = App;
  }

  public registerApplication(props: AppProps): IApp {
    const app = new this._AppConstructor();
    app.setApp(props);
    return app;
  }
}
