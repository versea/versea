import { inject, interfaces } from 'inversify';

import { IApp } from '../../application/app/service';
import { ISwitcherStatusEnum, ISwitcherStatusEnumKey } from '../../constants/status';
import { provide } from '../../provider';
import { IAppSwitcherContext, IAppSwitcherContextKey } from '../app-switcher-context/service';
import { IAppSwitcher, IAppSwitcherKey, SwitcherOptions } from './interface';

export * from './interface';

@provide(IAppSwitcherKey)
export class AppSwitcher implements IAppSwitcher {
  public context: IAppSwitcherContext | null = null;

  public currentContext: IAppSwitcherContext | null = null;

  protected readonly _AppSwitcherContext: interfaces.Newable<IAppSwitcherContext>;

  protected readonly _SwitcherStatusEnum: ISwitcherStatusEnum;

  constructor(
    // eslint-disable-next-line @typescript-eslint/naming-convention
    @inject(IAppSwitcherContextKey) AppSwitcherContext: interfaces.Newable<IAppSwitcherContext>,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    @inject(ISwitcherStatusEnumKey) SwitcherStatusEnum: ISwitcherStatusEnum,
  ) {
    this._AppSwitcherContext = AppSwitcherContext;
    this._SwitcherStatusEnum = SwitcherStatusEnum;
  }

  public get currentMountedApps(): IApp[][] {
    return this.currentContext ? this.currentContext.currentMountedApps : [];
  }

  public async switch(options: SwitcherOptions): Promise<void> {
    // 每次调用 switch 都需要存储一个 context 和 nextContext，分别用于执行 cancel 和 run。
    // ------
    // 考虑这么一种的场景：
    // 多次连续调用 switch，会产生一个 context 序列，假设是 [context0, context1, context2]
    // 第一次调用 switch，初始状态 context0 run，当前 context 是 context0
    // 第二次调用 switch，等待 context0 cancel, 当前 context 是 context1
    // 第三次调用 switch，context0 还未 cancel 等待 context1 cancel，这里特别注意的，是 context1 而不是 context0，当前 context 是 context2
    // 上面的序列的正确执行顺序是 context0 run -> context0 cancel -> context1 cancel -> context0 cancel 完成 -> context1 run -> context1 cancel 完成 -> context2 run
    // 只有这样调用才类似一个 switch 链，不会跳过某个 context 不执行 cancel 或 run。
    const context = this.context;
    const nextContext = this._createContext(options);
    this.context = nextContext;

    if (context) {
      await context.cancel();
    }
    // 无论当前是否有 context，都需要同步当前已经渲染的应用给将要运行的 nextContext
    nextContext.syncMountedApps(context ? context.currentMountedApps : []);

    this.currentContext = nextContext;
    return nextContext?.run();
  }

  protected _createContext(options: SwitcherOptions): IAppSwitcherContext {
    // @ts-expect-error 需要传入参数，但 inversify 这里的参数类型是 never
    return new this._AppSwitcherContext(options, {
      SwitcherStatusEnum: this._SwitcherStatusEnum,
    });
  }
}
