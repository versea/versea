import { inject, interfaces } from 'inversify';
import { differenceWith } from 'ramda';

import { IAppService, IAppServiceKey } from '../../application/app-service/interface';
import { IApp } from '../../application/app/service';
import { VERSEA_INTERNAL_TAP } from '../../constants';
import { ISwitcherStatus, ISwitcherStatusKey } from '../../enum/status';
import { IHooks, IHooksKey } from '../../hooks/service';
import { provide } from '../../provider';
import { IAppSwitcherContext } from '../app-switcher-context/service';
import { IRendererHookContext, IRendererHookContextKey } from '../renderer-hook-context/service';
import { IRendererStore, IRendererStoreKey } from '../renderer-store/service';
import { IRenderer, IRendererKey } from './interface';

export * from './interface';

@provide(IRendererKey)
export class Renderer implements IRenderer {
  protected readonly _hooks: IHooks;

  protected readonly _SwitcherStatus: ISwitcherStatus;

  protected readonly _HookContext: interfaces.Newable<IRendererHookContext>;

  protected readonly _appService: IAppService;

  protected readonly _rendererStore: IRendererStore;

  constructor(
    @inject(IHooksKey) hooks: IHooks,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    @inject(ISwitcherStatusKey) SwitcherStatus: ISwitcherStatus,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    @inject(IRendererHookContextKey) HookContext: interfaces.Newable<IRendererHookContext>,
    @inject(IAppServiceKey) appService: IAppService,
    @inject(IRendererStoreKey) rendererStore: IRendererStore,
  ) {
    this._hooks = hooks;
    this._SwitcherStatus = SwitcherStatus;
    this._HookContext = HookContext;
    this._appService = appService;
    this._rendererStore = rendererStore;

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
    // 销毁本次加载的副作用，暂无
  }

  protected _initHooks(): void {
    this._tapUnmount();
    this._tapUnmountNormal();
    this._tapUnmountFragmentApps();
    this._tapUnmountMainApp();
    this._tapUnmountRootFragmentApps();
    this._tapMount();
    this._tapMountMainApp();
    this._tapMountRootFragmentApps();
    this._tapMountFragmentApps();
  }

  /** 销毁应用 */
  protected _tapUnmount(): void {
    const { unmount, unmountNormal, unmountRootFragmentApps } = this._hooks;

    unmount.tap(VERSEA_INTERNAL_TAP, async (hookContext: IRendererHookContext) => {
      const { switcherContext } = hookContext;

      switcherContext.status = this._SwitcherStatus.Unmounting;
      await switcherContext.runTask(async () => unmountNormal.call(hookContext));
      await switcherContext.runTask(async () => unmountRootFragmentApps.call(hookContext));
      switcherContext.status = this._SwitcherStatus.Unmounted;
    });
  }

  /** 销毁普通路由上的应用 */
  protected _tapUnmountNormal(): void {
    const { unmountNormal, unmountFragmentApps, unmountMainApp } = this._hooks;

    unmountNormal.tap(VERSEA_INTERNAL_TAP, async (hookContext: IRendererHookContext) => {
      const { switcherContext, currentRoutes, mismatchIndex } = hookContext;

      // 倒序销毁当前渲染的应用，保证被依赖的应用后销毁
      for (let i = currentRoutes.length - 1; i >= 0; i--) {
        const apps = currentRoutes[i].apps;

        hookContext.setTarget(i);
        if (apps.length > 1) {
          await switcherContext.runTask(async () => unmountFragmentApps.call(hookContext));
        }
        if (i >= mismatchIndex) {
          await switcherContext.runTask(async () => unmountMainApp.call(hookContext));
        }
        hookContext.resetTarget();
      }
    });
  }

  /** 销毁普通路由碎片应用 */
  protected _tapUnmountFragmentApps(): void {
    this._hooks.unmountFragmentApps.tap(VERSEA_INTERNAL_TAP, async (hookContext: IRendererHookContext) => {
      const { target, switcherContext, mismatchIndex, rendererStore } = hookContext;
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const { currentRoute, targetRoute, index } = target!;
      const fragmentApps = currentRoute.apps.slice(1);
      const apps =
        index < mismatchIndex
          ? differenceWith((app1, app2) => app1 === app2, fragmentApps, targetRoute.apps.slice(1))
          : fragmentApps;
      await Promise.all(apps.map(async (app) => app.unmount(switcherContext)));
      rendererStore.removeApps(index, apps);
    });
  }

  /** 销毁普通路由主应用 */
  protected _tapUnmountMainApp(): void {
    this._hooks.unmountMainApp.tap(VERSEA_INTERNAL_TAP, async (hookContext: IRendererHookContext) => {
      const { target, switcherContext, currentRoutes, rendererStore } = hookContext;
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const { currentRoute, index } = target!;
      // 当前路由主应用与上一个路由的主应用不同，需要卸载主路由应用
      const lastApp: IApp | null = index === 0 ? null : currentRoutes[index - 1].apps[0];
      if (currentRoute.apps[0] !== lastApp) {
        await currentRoute.apps[0].unmount(switcherContext);
      }
      rendererStore.removeRoute(index);
    });
  }

  /** 销毁根部路由碎片应用 */
  protected _tapUnmountRootFragmentApps(): void {
    this._hooks.unmountRootFragmentApps.tap(VERSEA_INTERNAL_TAP, async (hookContext: IRendererHookContext) => {
      const { switcherContext, currentRootFragmentRoutes, targetRootFragmentRoutes, rendererStore } = hookContext;

      // 销毁当前多余的根部路由的对应的应用
      const differentRoutes = differenceWith(
        (route1, route2) => route1.equal(route2),
        currentRootFragmentRoutes,
        targetRootFragmentRoutes,
      );
      await Promise.all(
        differentRoutes.map(async (route) => {
          await route.apps[0].unmount(switcherContext);
          rendererStore.removeRootFragmentRoute(route);
        }),
      );
    });
  }

  /** 渲染应用 */
  protected _tapMount(): void {
    const { mount, mountMainApp, mountRootFragmentApps, mountFragmentApps } = this._hooks;

    mount.tap(VERSEA_INTERNAL_TAP, async (hookContext) => {
      const { switcherContext } = hookContext;

      switcherContext.status = this._SwitcherStatus.Mounting;
      await switcherContext.runTask(async () => mountMainApp.call(hookContext));
      await switcherContext.runTask(async () => mountRootFragmentApps.call(hookContext));
      await switcherContext.runTask(async () => mountFragmentApps.call(hookContext));
      switcherContext.status = this._SwitcherStatus.Mounted;
    });
  }

  /** 渲染主应用 */
  protected _tapMountMainApp(): void {
    this._hooks.mountMainApp.tap(VERSEA_INTERNAL_TAP, async (hookContext: IRendererHookContext) => {
      const { switcherContext, currentRoutes, targetRoutes, rendererStore } = hookContext;

      for (let i = 0; i < targetRoutes.length; i++) {
        const targetRoute = targetRoutes[i];
        const mainApp = targetRoute.apps[0];
        if (!currentRoutes[i]) {
          // 当前路由主应用与上一个路由的主应用不同，需要渲染主路由应用
          const lastApp: IApp | null = i === 0 ? null : targetRoutes[i - 1].apps[0];
          if (mainApp !== lastApp) {
            await switcherContext.runTask(async () => hookContext.bootstrapAndMount(mainApp, targetRoute));
          }
          rendererStore.appendRoute(targetRoute, [mainApp]);
        }
      }
    });
  }

  /** 渲染根部路由碎片应用 */
  protected _tapMountRootFragmentApps(): void {
    this._hooks.mountRootFragmentApps.tap(VERSEA_INTERNAL_TAP, async (hookContext: IRendererHookContext) => {
      const { currentRootFragmentRoutes, targetRootFragmentRoutes, rendererStore } = hookContext;

      const differentRoutes = differenceWith(
        (route1, route2) => {
          return route1.path === route2.path && route1.apps[0] === route2.apps[0];
        },
        targetRootFragmentRoutes,
        currentRootFragmentRoutes,
      );
      await Promise.all(
        differentRoutes.map(async (route) => {
          await hookContext.bootstrapAndMount(route.apps[0], route);
          rendererStore.appendRootFragmentRoute(route);
        }),
      );
    });
  }

  protected _tapMountFragmentApps(): void {
    this._hooks.mountFragmentApps.tap(VERSEA_INTERNAL_TAP, async (hookContext: IRendererHookContext) => {
      const { switcherContext, currentRoutes, targetRoutes, rendererStore } = hookContext;

      for (let i = 0; i < targetRoutes.length; i++) {
        const targetRoute = targetRoutes[i];
        const apps = differenceWith(
          (app1, app2) => app1 === app2,
          targetRoute.apps.slice(1),
          currentRoutes[i].apps.slice(1),
        );
        if (apps.length > 0) {
          await switcherContext.runTask(async () =>
            Promise.all(apps.map(async (app) => hookContext.bootstrapAndMount(app, targetRoute))),
          );
        }
        rendererStore.setApps(i, [...targetRoute.apps]);
      }
    });
  }

  protected _createRendererHookContext(switcherContext: IAppSwitcherContext): IRendererHookContext {
    // @ts-expect-error 需要传入参数
    // eslint-disable-next-line prettier/prettier
    return new this._HookContext({ switcherContext, matchedResult: switcherContext.matchedResult, rendererStore: this._rendererStore, appService: this._appService });
  }
}
