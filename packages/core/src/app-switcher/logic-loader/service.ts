/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { inject, interfaces } from 'inversify';

import { ISwitcherStatus, ISwitcherStatusKey } from '../../constants/status';
import { IHooks, IHooksKey } from '../../hooks/service';
import { provide } from '../../provider';
import { IAppSwitcherContext } from '../app-switcher-context/service';
import { ILogicLoaderHookContext, ILogicLoaderHookContextKey } from '../logic-loader-hook-context/service';
import { ILogicLoader, ILogicLoaderKey } from './interface';

export * from './interface';

@provide(ILogicLoaderKey)
export class LogicLoader implements ILogicLoader {
  public currentHookContext: ILogicLoaderHookContext | null = null;

  protected _hooks: IHooks;

  protected readonly _SwitcherStatus: ISwitcherStatus;

  protected _HookContext: interfaces.Newable<ILogicLoaderHookContext>;

  constructor(
    @inject(IHooksKey) hooks: IHooks,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    @inject(ISwitcherStatusKey) SwitcherStatus: ISwitcherStatus,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    @inject(ILogicLoaderHookContextKey) HookContext: interfaces.Newable<ILogicLoaderHookContext>,
  ) {
    this._hooks = hooks;
    this._SwitcherStatus = SwitcherStatus;
    this._HookContext = HookContext;

    this._initHooks();
  }

  public async load(switcherContext: IAppSwitcherContext): Promise<void> {
    const hookContext = this._createLogicLoaderHookContext(switcherContext);
    this.currentHookContext = hookContext;

    await this._runTransaction(async () => this._hooks.beforeLogicLoad.call(hookContext));

    // 开始加载应用
    hookContext.switcherContext.status = this._SwitcherStatus.Loading;
    for (const apps of hookContext.targetApps) {
      hookContext.currentLoadApps = apps;
      await this._runTransaction(async () => this._hooks.logicLoad.call(hookContext));
      hookContext.currentLoadApps = [];
    }
    // 加载应用完成，修改状态
    hookContext.switcherContext.status = this._SwitcherStatus.Loaded;

    await this._runTransaction(async () => this._hooks.afterLogicLoad.call(hookContext));

    // 无论什么情况加载完成都需要清空 currentHookContext
    this._restoreLogicLoaderHookContext();
  }

  protected _initHooks(): void {
    this._hooks.logicLoad.tap('internal-load-apps', async (hookContext) => {
      const apps = hookContext.currentLoadApps;
      await Promise.all(apps.map(async (app) => app.load(hookContext.switcherContext)));
    });
  }

  protected _createLogicLoaderHookContext(switcherContext: IAppSwitcherContext): ILogicLoaderHookContext {
    // @ts-expect-error 需要传入参数，但 inversify 这里的参数类型是 never
    return new this._HookContext({ switcherContext, matchedResult: switcherContext.matchedResult });
  }

  protected _restoreLogicLoaderHookContext(): void {
    this.currentHookContext = null;
  }

  protected async _runTransaction<T>(fn: () => Promise<T>): Promise<T> {
    const result = await this.currentHookContext!.switcherContext.runTransaction(
      fn,
      () => {
        this._restoreLogicLoaderHookContext();
      },
      () => {
        this._restoreLogicLoaderHookContext();
      },
    );
    return result;
  }
}
