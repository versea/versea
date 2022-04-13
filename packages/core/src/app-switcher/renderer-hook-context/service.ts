import { ExtensibleEntity } from '@versea/shared';

import { MatchedRoute } from '../../navigation/route/service';
import { provide } from '../../provider';
import { IAppSwitcherContext } from '../app-switcher-context/service';
import { IRendererStore } from '../renderer-store/service';
import {
  IRendererHookContext,
  IRendererHookContextKey,
  RendererHookContextOptions,
  NormalRendererTarget,
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

  constructor(options: RendererHookContextOptions) {
    super(options);
    this.switcherContext = options.switcherContext;
    this.rendererStore = options.rendererStore;

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
