import { inject, interfaces } from 'inversify';

import { VERSEA_INTERNAL_TAP } from '../../constants/constants';
import { ISwitcherStatus, ISwitcherStatusKey } from '../../constants/status';
import { IHooks, IHooksKey } from '../../hooks/service';
import { provide } from '../../provider';
import { IAppSwitcherContext } from '../app-switcher-context/service';
import { ILogicLoaderHookContext, ILogicLoaderHookContextKey } from '../logic-loader-hook-context/service';
import { ILogicLoader, ILogicLoaderKey } from './interface';

export * from './interface';

@provide(ILogicLoaderKey)
export class LogicLoader implements ILogicLoader {
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
    const { logicLoad } = this._hooks;
    const hookContext = this._createLogicLoaderHookContext(switcherContext);
    await switcherContext.runTask(async () => logicLoad.call(hookContext));
  }

  public restore(): void {
    // 销毁本次加载的副作用
  }

  protected _initHooks(): void {
    const { logicLoad, logicLoadApps } = this._hooks;

    // 执行逻辑加载应用的勾子
    logicLoad.tap(VERSEA_INTERNAL_TAP, async (hookContext) => this._onLoad(hookContext));

    // 执行逻辑加载单条应用数据的勾子
    logicLoadApps.tap(VERSEA_INTERNAL_TAP, async (hookContext) => {
      const apps = hookContext.currentLoadApps;
      await Promise.all(apps.map(async (app) => app.load(hookContext.switcherContext)));
    });
  }

  protected async _onLoad(hookContext: ILogicLoaderHookContext): Promise<void> {
    const { logicLoadApps } = this._hooks;
    const { switcherContext } = hookContext;

    // 开始加载应用
    switcherContext.status = this._SwitcherStatus.Loading;
    for (const apps of hookContext.targetApps) {
      hookContext.currentLoadApps = apps;
      await switcherContext.runTask(async () => logicLoadApps.call(hookContext));
      hookContext.currentLoadApps = [];
    }
    // 加载应用完成，修改状态
    hookContext.switcherContext.status = this._SwitcherStatus.Loaded;
  }

  protected _createLogicLoaderHookContext(switcherContext: IAppSwitcherContext): ILogicLoaderHookContext {
    // @ts-expect-error 需要传入参数，但 inversify 这里的参数类型是 never
    return new this._HookContext({ switcherContext, matchedResult: switcherContext.matchedResult });
  }
}
