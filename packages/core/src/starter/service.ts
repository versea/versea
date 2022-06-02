import { logWarn } from '@versea/shared';

import { IRouter } from '../navigation/router/interface';
import { lazyInject, provide } from '../provider';
import { IStarter } from './interface';

export * from './interface';

@provide(IStarter)
export class Starter implements IStarter {
  @lazyInject(IRouter) protected readonly _router!: IRouter;

  public isStarted = false;

  public async start(): Promise<void> {
    if (this.isStarted) {
      logWarn('Versea has already started, it should not start again.');
      return;
    }

    this.isStarted = true;
    return this._router.reroute();
  }
}
