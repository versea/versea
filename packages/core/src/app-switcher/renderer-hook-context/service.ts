import { ExtensibleEntity } from '@versea/shared';

import { IAppService } from '../../application/app-service/interface';
import { IApp } from '../../application/app/service';
import { MatchedRoute, RouteMeta } from '../../navigation/route/service';
import { provide } from '../../provider';
import { IAppSwitcherContext } from '../app-switcher-context/service';
import { IRendererStore } from '../renderer-store/service';
import {
  IRendererHookContext,
  IRendererHookContextKey,
  RendererHookContextOptions,
  NormalRendererTarget,
  RendererHookContextDependencies,
} from './interface';

export * from './interface';

@provide(IRendererHookContextKey, 'Constructor')
export class RendererHookContext extends ExtensibleEntity implements IRendererHookContext {
  public readonly switcherContext: IAppSwitcherContext;

  public targetRoutes: MatchedRoute[];

  public targetRootFragmentRoutes: MatchedRoute[];

  public readonly rendererStore: IRendererStore;

  public readonly mismatchIndex: number;

  public target: NormalRendererTarget | null = null;

  public bail = false;

  protected readonly _appService: IAppService;

  constructor(
    options: RendererHookContextOptions,
    { switcherContext, rendererStore, appService }: RendererHookContextDependencies,
  ) {
    super(options);
    // 绑定依赖
    this.switcherContext = switcherContext;
    this.rendererStore = rendererStore;
    this._appService = appService;

    // 保存目标路由信息
    const { routes, fragmentRoutes } = options.matchedResult;
    this.targetRoutes = routes;
    this.targetRootFragmentRoutes = fragmentRoutes;

    this.mismatchIndex = this._getMismatchIndex();
  }

  public get currentRoutes(): MatchedRoute[] {
    return this.rendererStore.currentRoutes;
  }

  public get currentRootFragmentRoutes(): MatchedRoute[] {
    return this.rendererStore.currentRootFragmentRoutes;
  }

  public setTarget(index: number): void {
    this.target = {
      index,
      currentRoute: this.currentRoutes[index],
      targetRoute: this.targetRoutes[index],
    };
  }

  public resetTarget(): void {
    this.target = null;
  }

  public async bootstrapAndMount(app: IApp, route: MatchedRoute): Promise<void> {
    const switcherContext = this.switcherContext;
    if (!app.isBootstrapped) {
      await app.bootstrap(switcherContext);
    }
    const meta: RouteMeta = route.apps[0] === app ? route.meta : (route.meta[app.name] as RouteMeta);
    if (meta.parentAppName && meta.parentContainerName) {
      const parentApp = this._appService.getApp(meta.parentAppName);
      await parentApp.waitForChildContainer(meta.parentContainerName, switcherContext);
    }
    return app.mount(switcherContext);
  }

  protected _getMismatchIndex(): number {
    const currentRoutes = this.currentRoutes;
    const targetRoutes = this.targetRoutes;
    for (let i = 0; i < currentRoutes.length; i++) {
      if (!currentRoutes[i].equal(targetRoutes[i])) {
        return i;
      }
    }

    return 0;
  }
}
