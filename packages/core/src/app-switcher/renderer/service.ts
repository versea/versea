import { inject } from 'inversify';
import { differenceWith } from 'ramda';

import { IApp } from '../../application/app/service';
import { IActionTargetType, IActionTargetTypeKey, IActionType, IActionTypeKey } from '../../constants/action';
import { MatchedRoutes } from '../../navigation/matcher/service';
import { MatchedRoute } from '../../navigation/route/service';
import { provide } from '../../provider';
import { RendererActionHandler } from './action';
import { IRenderer, IRendererKey } from './interface';

export * from './action';
export * from './interface';

@provide(IRendererKey)
export class Renderer implements IRenderer {
  public readonly currentRoutes: MatchedRoute[];

  public readonly currentRootFragmentRoutes: MatchedRoute[];

  protected readonly _ActionType: IActionType;

  protected readonly _ActionTargetType: IActionTargetType;

  constructor(
    // eslint-disable-next-line @typescript-eslint/naming-convention
    @inject(IActionTypeKey) ActionType: IActionType,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    @inject(IActionTargetTypeKey) ActionTargetType: IActionTargetType,
  ) {
    this._ActionType = ActionType;
    this._ActionTargetType = ActionTargetType;

    this.currentRoutes = [];
    this.currentRootFragmentRoutes = [];
  }

  public async render(matched: MatchedRoutes, onAction: RendererActionHandler): Promise<void> {
    await this._unmount(matched, onAction);
    await this._mount(matched, onAction);
  }

  protected async _unmount(
    { routes: targetRoutes, fragmentRoutes: targetFragments }: MatchedRoutes,
    onAction: RendererActionHandler,
  ): Promise<void> {
    await onAction({
      type: this._ActionType.BeforeUnmount,
      targetType: this._ActionTargetType.Null,
    });

    await this._unmountApps(targetRoutes, onAction);

    await onAction({
      type: this._ActionType.BeforeUnmountFragment,
      targetType: this._ActionTargetType.Null,
    });

    await this._unmountRootFragmentApps(targetFragments, onAction);

    await onAction({
      type: this._ActionType.Mounted,
      targetType: this._ActionTargetType.Null,
    });
  }

  protected async _mount(
    { routes: targetRoutes, fragmentRoutes: targetFragments }: MatchedRoutes,
    onAction: RendererActionHandler,
  ): Promise<void> {
    await onAction({
      type: this._ActionType.BeforeMount,
      targetType: this._ActionTargetType.Null,
    });

    await this._mountMainApps(targetRoutes, onAction);

    await onAction({
      type: this._ActionType.BeforeMountFragment,
      targetType: this._ActionTargetType.Null,
    });

    await this._mountRootFragmentApps(targetFragments, onAction);

    await this._mountFragmentApps(targetFragments, onAction);

    await onAction({
      type: this._ActionType.Mounted,
      targetType: this._ActionTargetType.Null,
    });
  }

  protected async _unmountApps(targetRoutes: MatchedRoute[], onAction: RendererActionHandler): Promise<void> {
    const currentRoutes = this.currentRoutes;
    const mismatchIndex = this._getMismatchIndex(targetRoutes);

    // unmount 匹配的路由的应用
    for (let i = currentRoutes.length - 1; i >= 0; i--) {
      const currentRoute = currentRoutes[i];
      const targetRoute = targetRoutes[i];
      const [mainApp, ...fragmentApps] = currentRoute.apps;

      if (i < mismatchIndex) {
        // 在 mismatchIndex 位置之前的 MatchedRoute 中的 apps，只删除碎片应用中多余的部分
        const differentApps = differenceWith((app1, app2) => app1 === app2, fragmentApps, targetRoute.apps.slice(1));
        if (differentApps.length > 0) {
          await onAction({
            type: this._ActionType.Unmount,
            targetType: this._ActionTargetType.Fragment,
            apps: differentApps,
            currentRoute,
            targetRoute,
          });
          currentRoute.apps = [mainApp, ...fragmentApps.filter((app) => !differentApps.includes(app))];
        }
        continue;
      }

      // 删除在 mismatchIndex 位置之后的 MatchedRoute 中的删除 apps
      if (fragmentApps.length > 0) {
        await onAction({
          type: this._ActionType.Unmount,
          targetType: this._ActionTargetType.Fragment,
          apps: fragmentApps,
          currentRoute,
          targetRoute,
        });
      }

      // 当主路由应用与上一个不同时，需要卸载主路由应用
      const lastApp: IApp | null = i === 0 ? null : currentRoutes[i - 1].apps[0];
      if (mainApp !== lastApp) {
        await onAction({
          type: this._ActionType.Unmount,
          targetType: this._ActionTargetType.MainApp,
          apps: [mainApp],
          currentRoute,
          targetRoute,
        });
      }
      // 删除整个 route 对象
      currentRoutes.splice(i, 1);
    }
  }

  protected async _unmountRootFragmentApps(
    targetRootFragmentRoutes: MatchedRoute[],
    onAction: RendererActionHandler,
  ): Promise<void> {
    // unmount 匹配的根部碎片路由的应用
    const currentRootFragmentRoutes = this.currentRootFragmentRoutes;
    const differentRoutes = differenceWith(
      (route1, route2) => {
        return route1.path === route2.path && route1.apps[0] === route2.apps[0];
      },
      currentRootFragmentRoutes,
      targetRootFragmentRoutes,
    );
    await Promise.all(
      differentRoutes.map(async (currentRoute) => {
        await onAction({
          type: this._ActionType.Unmount,
          targetType: this._ActionTargetType.RootFragment,
          apps: currentRoute.apps,
          currentRoute,
        });

        const index = currentRootFragmentRoutes.indexOf(currentRoute);
        if (index >= 0) {
          currentRootFragmentRoutes.splice(index, 1);
        }
      }),
    );
  }

  protected async _mountMainApps(targetRoutes: MatchedRoute[], onAction: RendererActionHandler): Promise<void> {
    const currentRoutes = this.currentRoutes;
    for (let i = 0; i < targetRoutes.length; i++) {
      const targetRoute = targetRoutes[i];
      const mainApp = targetRoute.apps[0];
      if (!currentRoutes[i]) {
        // 当主路由应用与上一个不同时，需要添加主路由应用
        const lastApp: IApp | null = i === 0 ? null : targetRoutes[i - 1].apps[0];
        if (mainApp !== lastApp) {
          await onAction({
            type: this._ActionType.Mount,
            targetType: this._ActionTargetType.MainApp,
            apps: [mainApp],
            targetRoute,
            parents: lastApp ? [lastApp] : [],
          });
        }
        currentRoutes.push(this._cloneMatchedRouteWithApps(targetRoute, [mainApp]));
      }
    }
  }

  protected async _mountRootFragmentApps(
    targetRootFragmentRoutes: MatchedRoute[],
    onAction: RendererActionHandler,
  ): Promise<void> {
    // unmount 匹配的根部碎片路由的应用
    const currentRootFragmentRoutes = this.currentRootFragmentRoutes;
    const differentRoutes = differenceWith(
      (route1, route2) => {
        return route1.path === route2.path && route1.apps[0] === route2.apps[0];
      },
      targetRootFragmentRoutes,
      currentRootFragmentRoutes,
    );
    await Promise.all(
      differentRoutes.map(async (targetRoute) => {
        await onAction({
          type: this._ActionType.Mount,
          targetType: this._ActionTargetType.RootFragment,
          apps: targetRoute.apps,
          targetRoute,
        });

        currentRootFragmentRoutes.push(this._cloneMatchedRouteWithApps(targetRoute, targetRoute.apps));
      }),
    );
  }

  protected async _mountFragmentApps(targetRoutes: MatchedRoute[], onAction: RendererActionHandler): Promise<void> {
    const currentRoutes = this.currentRoutes;
    for (let i = 0; i < targetRoutes.length; i++) {
      const targetRoute = targetRoutes[i];
      const currentRoute = currentRoutes[i];
      const differentApps = differenceWith(
        (app1, app2) => app1 === app2,
        targetRoute.apps.slice(1),
        currentRoute.apps.slice(1),
      );

      if (differentApps.length > 0) {
        const parents = this._findParentApps(differentApps, targetRoute.apps[0]);
        await onAction({
          type: this._ActionType.Mount,
          targetType: this._ActionTargetType.Fragment,
          apps: differentApps,
          currentRoute,
          targetRoute,
          parents,
        });
      }
      currentRoute.apps = [...targetRoute.apps];
    }
  }

  // Container 的渲染需要读取 meta 的 container 函数，这块后面重构
  protected _findParentApps(toMountApps: IApp[], defaultApp: IApp): IApp[] {
    const result = toMountApps.map(() => defaultApp);
    // for (const currentRoute of this.currentRoutes) {
    //   for (const app of currentRoute.apps) {
    //     toMountApps.forEach((toMountApp, index) => {
    //       if (app.hasChildContainerHook(toMountApp.name)) {
    //         result[index] = app;
    //       }
    //     });
    //   }
    // }
    return result;
  }

  protected _cloneMatchedRouteWithApps(route: MatchedRoute, apps: IApp[]): MatchedRoute {
    const { query, params } = route;
    const clonedRoute = route.getRoute().toMatchedRoute({
      query,
      params,
    });
    clonedRoute.apps = apps;
    return clonedRoute;
  }

  /** 获取当前匹配的路由数组和目标匹配的路由数组之间的不匹配的位置 */
  protected _getMismatchIndex(targetRoutes: MatchedRoute[]): number {
    const currentRoutes = this.currentRoutes;
    for (let i = 0; i < currentRoutes.length; i++) {
      const currentRoute = currentRoutes[i];
      const targetRoute = targetRoutes[i];

      if (currentRoute.path !== targetRoute.path || currentRoute.apps[0] !== targetRoute.apps[0]) {
        return i;
      }
    }

    return -1;
  }
}
