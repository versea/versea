import { ExtensibleEntity } from '@versea/shared';
import { difference } from 'ramda';

import { IApp } from '../../application/app/service';
import { IActionTargetType, IActionType } from '../../constants/action';
import { MatchedRoutes } from '../../navigation/matcher/service';
import { MatchedRoute } from '../../navigation/route/service';
import { provide } from '../../provider';
import { RendererActionHandler } from './action';
import { IRenderer, IRendererKey, RendererDependencies } from './interface';

export * from './interface';

// 当前：
// [
//   [A, B]
//   [A, J]
//   [A]
//   [A]
//   [A]
//   [H]
//   [H]
// ]

// 变成：
// [
//   [A, B]
//   [A, J, L]
//   [A]
//   [A, F]
//   [A, G]
//   [H]
//   [H, K]
// ]

@provide(IRendererKey, 'Constructor')
export class Renderer extends ExtensibleEntity implements IRenderer {
  public readonly routes: MatchedRoute[];

  public readonly rootFragments: MatchedRoute[];

  protected readonly _ActionType: IActionType;

  protected readonly _ActionTargetType: IActionTargetType;

  // eslint-disable-next-line @typescript-eslint/naming-convention
  constructor(options: MatchedRoutes, { ActionType, ActionTargetType }: RendererDependencies) {
    super(options);
    // 绑定依赖
    this._ActionType = ActionType;
    this._ActionTargetType = ActionTargetType;

    this.routes = options.routes;
    this.rootFragments = options.fragmentRoutes;
  }

  /**
   * 渲染应用
   * @description 不能直接 unmount 所有当前已经 mounted 的 apps，否则每一次切换路由，cost 会非常高。我们应该保证最大可复用能力，尽量减少 unmount 和 mount 的应用。
   */
  public async render(matched: MatchedRoutes, onAction: RendererActionHandler): Promise<void> {
    await this._unmount(matched, onAction);
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

    await this._unmountFragments(targetFragments, onAction);

    await onAction({
      type: this._ActionType.Mounted,
      targetType: this._ActionTargetType.Null,
    });
  }

  protected async _unmountApps(targetRoutes: MatchedRoute[], onAction: RendererActionHandler): Promise<void> {
    const routes = this.routes;
    const mismatchIndex = this._getMismatchIndex(targetRoutes);

    // unmount 匹配的路由的应用
    for (let i = routes.length - 1; i >= 0; i--) {
      const route = routes[i];
      const targetRoute = targetRoutes[i];
      const [mainApp, ...fragmentApps] = route.apps;

      if (i < mismatchIndex) {
        // 在 mismatchIndex 位置之前的 MatchedRoute 中的 apps，只删除碎片应用中多余的部分
        const apps = difference(fragmentApps, targetRoute.apps.slice(1));
        await onAction({
          type: this._ActionType.Unmount,
          targetType: this._ActionTargetType.Fragment,
          apps,
          route,
          targetRoute,
        });
        route.apps = [mainApp, ...fragmentApps.filter((app) => !apps.includes(app))];
        continue;
      }

      // 删除在 mismatchIndex 位置之后的 MatchedRoute 中的删除 apps
      await onAction({
        type: this._ActionType.Unmount,
        targetType: this._ActionTargetType.Fragment,
        apps: fragmentApps,
        route,
        targetRoute,
      });

      // 当主路由应用与上一个不同时，需要卸载主路由应用
      const lastApp: IApp | null = i === 0 ? null : routes[i - 1].apps[0];
      if (mainApp !== lastApp) {
        await onAction({
          type: this._ActionType.Unmount,
          targetType: this._ActionTargetType.MainApp,
          apps: [mainApp],
          route,
          targetRoute,
        });
      }
      // 删除整个 route 对象
      routes.splice(i, 1);
    }
  }

  protected async _unmountFragments(targetFragments: MatchedRoute[], onAction: RendererActionHandler): Promise<void> {
    // unmount 匹配的顶层碎片路由的应用
    const fragments = difference(this.rootFragments, targetFragments);
    await Promise.all(
      fragments.map(async (route) => {
        await onAction({
          type: this._ActionType.Unmount,
          targetType: this._ActionTargetType.RootFragment,
          apps: route.apps,
          route,
        });

        const index = this.rootFragments.indexOf(route);
        if (index >= 0) {
          this.rootFragments.splice(index, 1);
        }
      }),
    );
  }

  /** 获取当前匹配的路由数组和目标匹配的路由数组之间的不匹配的位置 */
  protected _getMismatchIndex(targetRoutes: MatchedRoute[]): number {
    const routes = this.routes;
    for (let i = 0; i < routes.length; i++) {
      const route = routes[i];
      const targetRoute = targetRoutes[i];

      if (route.path !== targetRoute.path || route.apps[0] !== targetRoute.apps[0]) {
        return i;
      }
    }

    return -1;
  }
}
