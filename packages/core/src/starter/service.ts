import { IRouter, IRouterKey } from '../navigation/router/service';
import { lazyInject, provide } from '../provider';
import { IStarter, IStarterKey, StartOptions } from './interface';

export * from './interface';

@provide(IStarterKey)
export class Starter implements IStarter {
  @lazyInject(IRouterKey) protected readonly _router!: IRouter;

  public isStarted = false;

  public startOptions: StartOptions = {};

  public async start(options: StartOptions = {}): Promise<void> {
    if (this.isStarted) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Versea has already started, it should not start again.');
        return;
      }
    }
    this.startOptions = options;
    this.isStarted = true;
    return this._router.reroute();
  }
}
