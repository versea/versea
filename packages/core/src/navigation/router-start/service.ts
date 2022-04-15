import { inject } from 'inversify';

import { IAppSwitcher } from '../../app-switcher/app-switcher/service';
import { provide } from '../../provider';
import { IRouter, IRouterKey } from '../router/service';
import { IRouterStarter, IRouterStarterKey } from './interface';

export * from './interface';

@provide(IRouterStarterKey)
export class RouterStarter implements IRouterStarter {
  public isStarted = false;

  protected readonly _router: IRouter;

  constructor(@inject(IRouterKey) router: IRouter) {
    this._router = router;
  }

  public async start(appSwitcher: IAppSwitcher): Promise<void> {
    if (this.isStarted) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Versea has already started, it should not start again.');
        return;
      }
    }

    this.isStarted = true;
    return this._router.reroute(appSwitcher);
  }
}
