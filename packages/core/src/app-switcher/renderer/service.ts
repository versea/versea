import { inject, interfaces } from 'inversify';
import { differenceWith } from 'ramda';

import { IApp } from '../../application/app/service';
import { VERSEA_INTERNAL_TAP } from '../../constants/constants';
import { ISwitcherStatus, ISwitcherStatusKey } from '../../constants/status';
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

  protected readonly _rendererStore: IRendererStore;

  constructor(
    @inject(IHooksKey) hooks: IHooks,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    @inject(ISwitcherStatusKey) SwitcherStatus: ISwitcherStatus,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    @inject(IRendererHookContextKey) HookContext: interfaces.Newable<IRendererHookContext>,
    @inject(IRendererStoreKey) rendererStore: IRendererStore,
  ) {
    this._hooks = hooks;
    this._SwitcherStatus = SwitcherStatus;
    this._HookContext = HookContext;
    this._rendererStore = rendererStore;

    this._initHooks();
  }

  public async render(switcherContext: IAppSwitcherContext): Promise<void> {
    const { unmount, mount } = this._hooks;
    const hookContext = this._createRendererHookContext(switcherContext);

    await switcherContext.runTask(async () => unmount.call(hookContext));
    switcherContext.callEvent();
    await switcherContext.runTask(async () => mount.call(hookContext));
  }

  public restore(): void {
    // 销毁本次加载的副作用，暂无
  }

  protected _initHooks(): void {
    const { unmount, unmountNormal, unmountFragmentApps, unmountMainApp, unmountRoot, mount } = this._hooks;

    // 执行销毁应用
    unmount.tap(VERSEA_INTERNAL_TAP, async (hookContext) => this._onUnmount(hookContext));

    // 执行销毁普通路由
    unmountNormal.tap(VERSEA_INTERNAL_TAP, async (hookContext) => this._onUnmountNormal(hookContext));

    // 执行销毁普通路由碎片应用
    unmountFragmentApps.tap(VERSEA_INTERNAL_TAP, async (hookContext) => this._onUnmountFragmentApps(hookContext));

    // 执行销毁普通路由主应用
    unmountMainApp.tap(VERSEA_INTERNAL_TAP, async (hookContext) => this._onUnmountMainApp(hookContext));

    // 执行销毁根部路由碎片应用
    unmountRoot.tap(VERSEA_INTERNAL_TAP, async (hookContext) => this._onUnmountRoot(hookContext));

    // 执行渲染应用
    mount.tap(VERSEA_INTERNAL_TAP, async (hookContext) => this._onMount(hookContext));
  }

  protected async _onUnmount(hookContext: IRendererHookContext): Promise<void> {
    const { unmountNormal, unmountRoot } = this._hooks;
    const { switcherContext } = hookContext;

    switcherContext.status = this._SwitcherStatus.Unmounting;
    await switcherContext.runTask(async () => unmountNormal.call(hookContext));
    await switcherContext.runTask(async () => unmountRoot.call(hookContext));
    switcherContext.status = this._SwitcherStatus.Unmounted;
  }

  protected async _onMount(hookContext: IRendererHookContext): Promise<void> {
    const { switcherContext } = hookContext;

    switcherContext.status = this._SwitcherStatus.Mounting;
    // TODO: mount
    await Promise.resolve();
    switcherContext.status = this._SwitcherStatus.Mounted;
  }

  protected async _onUnmountNormal(hookContext: IRendererHookContext): Promise<void> {
    const { unmountFragmentApps, unmountMainApp } = this._hooks;
    const { switcherContext, currentRoutes, mismatchIndex } = hookContext;

    // 倒序销毁当前渲染的应用
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
  }

  protected async _onUnmountFragmentApps(hookContext: IRendererHookContext): Promise<void> {
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
  }

  protected async _onUnmountMainApp(hookContext: IRendererHookContext): Promise<void> {
    const { target, switcherContext, currentRoutes, rendererStore } = hookContext;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const { currentRoute, index } = target!;
    // 主路由应用与上一个不同，需要卸载主路由应用
    const lastApp: IApp | null = index === 0 ? null : currentRoutes[index - 1].apps[0];
    if (currentRoute.apps[0] !== lastApp) {
      await currentRoute.apps[0].unmount(switcherContext);
    }
    rendererStore.removeRoute(index);
  }

  protected async _onUnmountRoot(hookContext: IRendererHookContext): Promise<void> {
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
  }

  protected _createRendererHookContext(switcherContext: IAppSwitcherContext): IRendererHookContext {
    // @ts-expect-error 需要传入参数
    // eslint-disable-next-line prettier/prettier
    return new this._HookContext({ switcherContext, matchedResult: switcherContext.matchedResult, rendererStore: this._rendererStore });
  }
}
