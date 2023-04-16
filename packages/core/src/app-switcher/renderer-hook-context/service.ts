import {
  ExtensibleEntity,
  logError,
  runWithTimeout,
  VerseaNotFoundContainerError,
  VerseaTimeoutError,
} from '@versea/shared';

import { IAppService } from '../../application/app-service/interface';
import { IApp } from '../../application/app/interface';
import { MatchedRoute } from '../../navigation/route/interface';
import { provide } from '../../provider';
import { IAppSwitcherContext } from '../app-switcher-context/interface';
import { IRouteState } from '../route-state/interface';
import { IRendererHookContext, RendererHookContextOptions, RendererHookContextDependencies } from './interface';

export * from './interface';

@provide(IRendererHookContext, 'Constructor')
export class RendererHookContext extends ExtensibleEntity implements IRendererHookContext {
  public readonly switcherContext: IAppSwitcherContext;

  public targetRoutes: MatchedRoute[];

  public targetRootFragmentRoutes: MatchedRoute[];

  public readonly routeState: IRouteState;

  public readonly mismatchIndex: number;

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

  public async mount(app: IApp, route: MatchedRoute): Promise<void> {
    const switcherContext = this.switcherContext;
    // 解构出应用对应的 meta 信息
    const meta = route.getMeta(app);

    try {
      if (meta.parentAppName && meta.parentContainerName) {
        const parentApp = this._appService.getApp(meta.parentAppName);
        if (parentApp) {
          await runWithTimeout(
            parentApp.waitForChildContainer(meta.parentContainerName, switcherContext),
            parentApp.timeoutConfig.waitForChildContainer,
          );
        }
      }
      await app.mount(switcherContext, route);
    } catch (error) {
      if (error instanceof VerseaNotFoundContainerError || error instanceof VerseaTimeoutError) {
        logError(error, app.name);
      } else {
        throw error;
      }
    }
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
