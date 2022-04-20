import { ExtensibleEntity } from '@versea/shared';

import { IAppService } from '../../application/app-service/interface';
import { IApp } from '../../application/app/service';
import { MatchedRoute, RouteMeta } from '../../navigation/route/service';
import { provide } from '../../provider';
import { IAppSwitcherContext } from '../app-switcher-context/service';
import { IRouteState } from '../route-state/service';
import {
  IRendererHookContext,
  IRendererHookContextKey,
  RendererHookContextOptions,
  RendererHookContextDependencies,
} from './interface';

export * from './interface';

@provide(IRendererHookContextKey, 'Constructor')
export class RendererHookContext extends ExtensibleEntity implements IRendererHookContext {
  public readonly switcherContext: IAppSwitcherContext;

  public targetRoutes: MatchedRoute[];

  public targetRootFragmentRoutes: MatchedRoute[];

  public readonly routeState: IRouteState;

  public readonly mismatchIndex: number;

  public bail = false;

  protected readonly _appService: IAppService;

  constructor(
    options: RendererHookContextOptions,
    { appService, routeState, switcherContext }: RendererHookContextDependencies,
  ) {
    super(options);
    // 绑定依赖
    this._appService = appService;
    this.routeState = routeState;
    this.switcherContext = switcherContext;

    const { routes, fragmentRoutes } = options.matchedResult;
    this.targetRoutes = routes;
    this.targetRootFragmentRoutes = fragmentRoutes;

    this.mismatchIndex = this._getMismatchIndex();
  }

  public get currentRoutes(): MatchedRoute[] {
    return this.routeState.current;
  }

  public get currentRootFragmentRoutes(): MatchedRoute[] {
    return this.routeState.currentRootFragments;
  }

  public async bootstrapAndMount(app: IApp, route: MatchedRoute): Promise<void> {
    const switcherContext = this.switcherContext;
    if (!app.isBootstrapped) {
      await app.bootstrap(switcherContext);
    }
    // 解构出应用对应的 meta 信息
    const meta: RouteMeta = route.apps[0] === app ? route.meta : (route.meta[app.name] as RouteMeta);
    if (meta.parentAppName && meta.parentContainerName) {
      const parentApp = this._appService.getApp(meta.parentAppName);
      await parentApp.waitForChildContainer(meta.parentContainerName, switcherContext);
    }
    return app.mount(switcherContext);
  }

  protected _getMismatchIndex(): number {
    const currentRoutes = this.currentRoutes;
    for (let i = 0; i < currentRoutes.length; i++) {
      if (!currentRoutes[i].equal(this.targetRoutes[i])) {
        return i;
      }
    }

    return currentRoutes.length;
  }
}
