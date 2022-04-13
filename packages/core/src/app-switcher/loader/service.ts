import { inject, interfaces } from 'inversify';

import { VERSEA_INTERNAL_TAP } from '../../constants/constants';
import { ISwitcherStatus, ISwitcherStatusKey } from '../../constants/status';
import { IHooks, IHooksKey } from '../../hooks/service';
import { provide } from '../../provider';
import { IAppSwitcherContext } from '../app-switcher-context/service';
import { ILoaderHookContext, ILoaderHookContextKey } from '../loader-hook-context/service';
import { ILoader, ILoaderKey } from './interface';

export * from './interface';

@provide(ILoaderKey)
export class Loader implements ILoader {
  protected _hooks: IHooks;

  protected readonly _SwitcherStatus: ISwitcherStatus;

  protected _HookContext: interfaces.Newable<ILoaderHookContext>;

  constructor(
    @inject(IHooksKey) hooks: IHooks,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    @inject(ISwitcherStatusKey) SwitcherStatus: ISwitcherStatus,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    @inject(ILoaderHookContextKey) HookContext: interfaces.Newable<ILoaderHookContext>,
  ) {
    this._hooks = hooks;
    this._SwitcherStatus = SwitcherStatus;
    this._HookContext = HookContext;

    this._initHooks();
  }

  public async load(switcherContext: IAppSwitcherContext): Promise<void> {
    const { load } = this._hooks;
    const hookContext = this._createLoaderHookContext(switcherContext);
    await switcherContext.runTask(async () => load.call(hookContext));
  }

  public restore(): void {
    // 销毁本次加载的副作用
  }

  protected _initHooks(): void {
    this._tapLoad();
    this._tapLoadApps();
  }

  /** 加载应用 */
  protected _tapLoad(): void {
    const { load, loadApps } = this._hooks;
    load.tap(VERSEA_INTERNAL_TAP, async (hookContext) => {
      const { switcherContext } = hookContext;

      // 开始加载应用
      switcherContext.status = this._SwitcherStatus.Loading;
      for (const apps of hookContext.targetApps) {
        hookContext.currentLoadApps = apps;
        await switcherContext.runTask(async () => loadApps.call(hookContext));
        hookContext.currentLoadApps = [];
      }
      // 加载应用完成，修改状态
      hookContext.switcherContext.status = this._SwitcherStatus.Loaded;
    });
  }

  protected _tapLoadApps(): void {
    this._hooks.loadApps.tap(VERSEA_INTERNAL_TAP, async (hookContext) => {
      const apps = hookContext.currentLoadApps;
      await Promise.all(apps.map(async (app) => app.load(hookContext.switcherContext)));
    });
  }

  protected _createLoaderHookContext(switcherContext: IAppSwitcherContext): ILoaderHookContext {
    // @ts-expect-error 需要传入参数，但 inversify 这里的参数类型是 never
    return new this._HookContext({ switcherContext, matchedResult: switcherContext.matchedResult });
  }
}
