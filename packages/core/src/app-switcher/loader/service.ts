import { inject, interfaces } from 'inversify';

import { VERSEA_INTERNAL_TAP } from '../../constants';
import { ISwitcherStatus } from '../../enum/status';
import { IHooks } from '../../hooks/interface';
import { provide } from '../../provider';
import { IAppSwitcherContext } from '../app-switcher-context/interface';
import { ILoaderHookContext } from '../loader-hook-context/interface';
import { ILoader } from './interface';

export * from './interface';

@provide(ILoader)
export class Loader implements ILoader {
  protected _hooks: IHooks;

  protected readonly _SwitcherStatus: ISwitcherStatus;

  protected _HookContext: interfaces.Newable<ILoaderHookContext>;

  constructor(
    @inject(IHooks) hooks: IHooks,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    @inject(ISwitcherStatus) SwitcherStatus: ISwitcherStatus,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    @inject(ILoaderHookContext) HookContext: interfaces.Newable<ILoaderHookContext>,
  ) {
    this._hooks = hooks;
    this._SwitcherStatus = SwitcherStatus;
    this._HookContext = HookContext;

    this._onLoad();
  }

  public async load(switcherContext: IAppSwitcherContext): Promise<void> {
    const { load } = this._hooks;
    const context = this._createContext(switcherContext);
    await switcherContext.runTask(async () => load.call(context));
  }

  public restore(): void {
    // 销毁本次加载的副作用
  }

  /** 加载应用 */
  protected _onLoad(): void {
    this._hooks.load.tap(VERSEA_INTERNAL_TAP, async (context) => {
      const { switcherContext, apps } = context;

      // 开始加载应用
      switcherContext.status = this._SwitcherStatus.Loading;
      await Promise.all(apps.map(async (app) => app.load(switcherContext)));
      // 加载应用完成，修改状态
      switcherContext.status = this._SwitcherStatus.Loaded;
    });
  }

  /** 创建加载应用的上下文 */
  protected _createContext(switcherContext: IAppSwitcherContext): ILoaderHookContext {
    // @ts-expect-error 需要传入参数，但 inversify 这里的参数类型是 never
    return new this._HookContext({ switcherContext, matchedResult: switcherContext.matchedResult });
  }
}
