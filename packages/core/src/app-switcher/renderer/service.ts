import { inject, interfaces } from 'inversify';
import { differenceWith } from 'ramda';

import { IAppService } from '../../application/app-service/interface';
import { IApp } from '../../application/app/interface';
import { VERSEA_INTERNAL_TAP } from '../../constants';
import { ISwitcherStatus } from '../../enum/status';
import { IHooks } from '../../hooks/interface';
import { provide } from '../../provider';
import { IAppSwitcherContext } from '../app-switcher-context/interface';
import { IRendererHookContext } from '../renderer-hook-context/interface';
import { IRouteState } from '../route-state/interface';
import { IRenderer } from './interface';

export * from './interface';

@provide(IRenderer)
export class Renderer implements IRenderer {
  protected readonly _SwitcherStatus: ISwitcherStatus;

  protected readonly _HookContext: interfaces.Newable<IRendererHookContext>;

  protected readonly _hooks: IHooks;

  protected readonly _appService: IAppService;

  protected readonly _routeState: IRouteState;

  constructor(
    // eslint-disable-next-line @typescript-eslint/naming-convention
    @inject(ISwitcherStatus) SwitcherStatus: ISwitcherStatus,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    @inject(IRendererHookContext) HookContext: interfaces.Newable<IRendererHookContext>,
    @inject(IHooks) hooks: IHooks,
    @inject(IAppService) appService: IAppService,
    @inject(IRouteState) routeState: IRouteState,
  ) {
    this._SwitcherStatus = SwitcherStatus;
    this._HookContext = HookContext;
    this._hooks = hooks;
    this._appService = appService;
    this._routeState = routeState;

    this._initHooks();
  }

  public async render(switcherContext: IAppSwitcherContext): Promise<void> {
    const { unmount, mount } = this._hooks;
    const hookContext = this._createRendererHookContext(switcherContext);

    await switcherContext.runTask(async () => unmount.call(hookContext));
    switcherContext.callEvent();
    switcherContext.status = this._SwitcherStatus.NotMounted;
    await switcherContext.runTask(async () => mount.call(hookContext));
  }

  public restore(): void {
    // 销毁加载的副作用
  }

  /** 添加内置渲染 Hooks */
  protected _initHooks(): void {
    this._onUnmount();
    this._onUnmountApps();
    this._onUnmountRootFragmentApps();
    this._onMount();
    this._onMountMainApp();
    this._onMountRootFragmentApps();
    this._onMountFragmentApps();
  }

  /** 销毁应用 */
  protected _onUnmount(): void {
    const { unmount, unmountApps, unmountRootFragmentApps } = this._hooks;

    unmount.tap(VERSEA_INTERNAL_TAP, async (hookContext: IRendererHookContext) => {
      const { switcherContext } = hookContext;

      switcherContext.status = this._SwitcherStatus.Unmounting;
      await switcherContext.runTask(async () => unmountApps.call(hookContext));
      await switcherContext.runTask(async () => unmountRootFragmentApps.call(hookContext));
      switcherContext.status = this._SwitcherStatus.Unmounted;
    });
  }

  /** 销毁普通路由的应用 */
  protected _onUnmountApps(): void {
    this._hooks.unmountApps.tap(VERSEA_INTERNAL_TAP, async (hookContext: IRendererHookContext) => {
      const { switcherContext, currentRoutes, targetRoutes, mismatchIndex, routeState } = hookContext;

      // 倒序销毁当前渲染的应用，以此保证被依赖的应用后销毁
      for (let i = currentRoutes.length - 1; i >= 0; i--) {
        const currentRoute = currentRoutes[i];
        const targetRoute = targetRoutes[i];
        const [mainApp, ...fragmentApps] = currentRoute.apps;

        if (fragmentApps.length) {
          const toUnmountFragmentApps =
            i < mismatchIndex
              ? differenceWith((app1, app2) => app1 === app2, fragmentApps, targetRoute.apps.slice(1))
              : fragmentApps;
          await switcherContext.runTask(async () =>
            Promise.all(toUnmountFragmentApps.map(async (app) => app.unmount(switcherContext, currentRoute))),
          );
          routeState.removeApps(i, toUnmountFragmentApps);
        }
        if (i >= mismatchIndex) {
          const parentAppLike: IApp | null = i === 0 ? null : currentRoutes[i - 1].apps[0];
          if (mainApp !== parentAppLike) {
            await switcherContext.runTask(async () => currentRoute.apps[0].unmount(switcherContext, currentRoute));
          }
          routeState.pop();
        }
      }
    });
  }

  /** 销毁根部路由碎片应用 */
  protected _onUnmountRootFragmentApps(): void {
    this._hooks.unmountRootFragmentApps.tap(VERSEA_INTERNAL_TAP, async (hookContext: IRendererHookContext) => {
      const { switcherContext, currentRootFragmentRoutes, targetRootFragmentRoutes, routeState } = hookContext;

      // 销毁当前多余的根部碎片应用
      const differentRoutes = differenceWith(
        (route1, route2) => route1.equal(route2),
        currentRootFragmentRoutes,
        targetRootFragmentRoutes,
      );
      await Promise.all(
        differentRoutes.map(async (route) => {
          await route.apps[0].unmount(switcherContext, route);
          routeState.removeRootFragment(route);
        }),
      );
    });
  }

  /** 渲染应用 */
  protected _onMount(): void {
    const { mount, mountMainApps, mountRootFragmentApps, mountFragmentApps } = this._hooks;

    mount.tap(VERSEA_INTERNAL_TAP, async (hookContext) => {
      const { switcherContext } = hookContext;

      switcherContext.status = this._SwitcherStatus.Mounting;
      await switcherContext.runTask(async () => mountMainApps.call(hookContext));
      await switcherContext.runTask(async () => mountRootFragmentApps.call(hookContext));
      await switcherContext.runTask(async () => mountFragmentApps.call(hookContext));
      switcherContext.status = this._SwitcherStatus.Mounted;
    });
  }

  /** 渲染主应用 */
  protected _onMountMainApp(): void {
    this._hooks.mountMainApps.tap(VERSEA_INTERNAL_TAP, async (hookContext: IRendererHookContext) => {
      const { switcherContext, currentRoutes, targetRoutes, routeState } = hookContext;

      for (let i = 0; i < targetRoutes.length; i++) {
        const targetRoute = targetRoutes[i];
        const mainApp = targetRoute.apps[0];
        if (!currentRoutes[i]) {
          const parentAppLike: IApp | null = i === 0 ? null : targetRoutes[i - 1].apps[0];
          // 不相等证明 parentAppLike 是 mainApp 的父应用
          if (mainApp !== parentAppLike) {
            await switcherContext.runTask(async () => hookContext.mount(mainApp, targetRoute));
          }
          routeState.append(targetRoute, [mainApp]);
        }
      }
    });
  }

  /** 渲染根部路由碎片应用 */
  protected _onMountRootFragmentApps(): void {
    this._hooks.mountRootFragmentApps.tap(VERSEA_INTERNAL_TAP, async (hookContext: IRendererHookContext) => {
      const { currentRootFragmentRoutes, targetRootFragmentRoutes, routeState } = hookContext;

      const differentRoutes = differenceWith(
        (route1, route2) => {
          return route1.path === route2.path && route1.apps[0] === route2.apps[0];
        },
        targetRootFragmentRoutes,
        currentRootFragmentRoutes,
      );
      await Promise.all(
        differentRoutes.map(async (route) => {
          await hookContext.mount(route.apps[0], route);
          routeState.appendRootFragment(route);
        }),
      );
    });
  }

  protected _onMountFragmentApps(): void {
    this._hooks.mountFragmentApps.tap(VERSEA_INTERNAL_TAP, async (hookContext: IRendererHookContext) => {
      const { switcherContext, currentRoutes, targetRoutes, routeState } = hookContext;

      for (let i = 0; i < targetRoutes.length; i++) {
        const targetRoute = targetRoutes[i];
        const toMountFragmentApps = differenceWith(
          (app1, app2) => app1 === app2,
          targetRoute.apps.slice(1),
          currentRoutes[i].apps.slice(1),
        );
        if (toMountFragmentApps.length > 0) {
          await switcherContext.runTask(async () =>
            Promise.all(toMountFragmentApps.map(async (app) => hookContext.mount(app, targetRoute))),
          );
          routeState.appendApps(i, toMountFragmentApps, targetRoute.meta);
        }
      }
    });
  }

  protected _createRendererHookContext(switcherContext: IAppSwitcherContext): IRendererHookContext {
    return new this._HookContext(
      // @ts-expect-error 需要传入参数
      { matchedResult: switcherContext.matchedResult },
      { switcherContext, appService: this._appService, routeState: this._routeState },
    );
  }
}
