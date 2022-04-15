import { inject } from 'inversify';

import { IAppSwitcher, IAppSwitcherKey } from '../../app-switcher/app-switcher/service';
import { IApp } from '../../application/app/service';
import { provide } from '../../provider';
import { MatchedRoutes } from '../matcher/service';
import { bindRouter } from '../navigation-events';
import { IRouteKey, RouteConfig } from '../route/service';
import { IRouterStarter, IRouterStarterKey } from '../router-start/service';
import { IRouter } from '../router/service';
import { IRouterController, IRouterControllerKey } from './interface';

export * from './interface';

@provide(IRouterControllerKey)
export class RouterController implements IRouterController {
  protected readonly _router: IRouter;

  protected readonly _appSwitcher: IAppSwitcher;

  protected readonly _routerStarter: IRouterStarter;

  /** 标识是否已经给 navigationEvent 传入 router 的实例 */
  protected _hasBindRouter = false;

  constructor(
    @inject(IAppSwitcherKey) appSwitcher: IAppSwitcher,
    @inject(IRouteKey) router: IRouter,
    @inject(IRouterStarterKey) routerStarter: IRouterStarter,
  ) {
    this._appSwitcher = appSwitcher;
    this._router = router;
    this._routerStarter = routerStarter;
  }

  public get isStarted(): boolean {
    return this._routerStarter.isStarted;
  }

  public addRoutes(routes: RouteConfig[], app: IApp): void {
    // 将 router 传给 navigationEvent
    if (!this._hasBindRouter) {
      this._hasBindRouter = true;
      bindRouter(this);
    }
    this._router.addRoutes(routes, app);
  }

  public match(): MatchedRoutes {
    return this._router.match();
  }

  public async reroute(navigationEvent?: Event): Promise<void> {
    return this._router.reroute(this._appSwitcher, navigationEvent);
  }

  public async start(): Promise<void> {
    return this._routerStarter.start(this._appSwitcher);
  }
}
