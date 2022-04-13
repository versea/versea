import { inject } from 'inversify';

import { IAppSwitcher, IAppSwitcherKey } from '../../app-switcher/app-switcher/service';
import { IApp } from '../../application/app/service';
import { provide } from '../../provider';
import { MatchedResult } from '../matcher/service';
import { bindRouter } from '../navigation-events';
import { RouteConfig } from '../route/service';
import { IRouter, IRouterKey } from '../router/service';
import { IRouterController, IRouterControllerKey } from './interface';

export * from './interface';

@provide(IRouterControllerKey)
export class RouterController implements IRouterController {
  protected readonly _router: IRouter;

  protected readonly _appSwitcher: IAppSwitcher;

  /** 标识是否已经给 navigationEvent 传入 router 的实例 */
  protected _hasBindRouter = false;

  constructor(@inject(IAppSwitcherKey) appSwitcher: IAppSwitcher, @inject(IRouterKey) router: IRouter) {
    this._appSwitcher = appSwitcher;
    this._router = router;
  }

  public get isStarted(): boolean {
    return this._router.isStarted;
  }

  public addRoutes(routes: RouteConfig[], app: IApp): void {
    // 将 router 传给 navigationEvent
    if (!this._hasBindRouter) {
      this._hasBindRouter = true;
      bindRouter(this);
    }
    this._router.addRoutes(routes, app);
  }

  public match(): MatchedResult {
    return this._router.match();
  }

  public async reroute(navigationEvent?: Event): Promise<void> {
    return this._router.reroute(this._appSwitcher, navigationEvent);
  }

  public async start(): Promise<void> {
    return this._router.start(this._appSwitcher);
  }
}
