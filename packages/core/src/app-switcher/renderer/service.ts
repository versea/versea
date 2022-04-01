import { ExtensibleEntity } from '@versea/shared';
import { difference } from 'ramda';

import { IApp } from '../../application/app/service';
import { Matched } from '../../navigation/matcher/service';
import { MatchedRoute } from '../../navigation/route/service';
import { provide } from '../../provider';
import { IRenderer, IRendererKey, ActionHandler } from './interface';

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

  public readonly fragments: MatchedRoute[];

  constructor(options: Matched) {
    super(options);

    this.routes = options.routes;
    this.fragments = options.fragments;
  }

  public async render(matched: Matched, onAction: ActionHandler): Promise<void> {
    await this._unmount(matched, onAction);
  }

  protected async _unmount(
    { routes: targetRoutes, fragments: targetFragments }: Matched,
    onAction: ActionHandler,
  ): Promise<void> {
    const routes = this.routes;
    const mismatchIndex = this._getMismatchIndex(targetRoutes);

    // unmount routes
    for (let i = routes.length - 1; i >= 0; i--) {
      const route = routes[i];
      const [mainApp, ...fragmentApps] = route.apps;

      if (i < mismatchIndex) {
        const toUnmountApps = difference(fragmentApps, targetRoutes[i].apps.slice(1));
        await onAction(toUnmountApps);
        route.apps = fragmentApps.filter((app) => toUnmountApps.includes(app));
        continue;
      }

      await onAction(fragmentApps);
      const lastApp: IApp | null = i === 0 ? null : routes[i - 1].apps[0];
      if (mainApp !== lastApp) {
        await onAction([mainApp]);
      }
      // 删除整行
    }

    // unmount fragments
    const toUnmountApps = difference(this.fragments, targetFragments);
    await onAction(toUnmountApps);
    // 删除数组多余的元素
  }

  protected _getMismatchIndex(targetRoutes: MatchedRoute[]): number {
    const routes = this.routes;

    let mismatchIndex = -1;
    for (let i = 0; i < routes.length; i++) {
      const route = routes[i];
      const targetRoute = targetRoutes[i];

      if (route.path !== targetRoute.path || route.apps[0] !== targetRoute.apps[0]) {
        mismatchIndex = i;
        break;
      }
    }

    return mismatchIndex;
  }
}
