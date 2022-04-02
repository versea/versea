import { ExtensibleEntity, VerseaCanceledError, createPromiseMonitor, memoizePromise } from '@versea/shared';

import { IApp } from '../../application/app/service';
import { IActionType, IActionTargetType } from '../../constants/action';
import { ISwitcherStatus } from '../../constants/status';
import { MatchedRoutes } from '../../navigation/matcher/service';
import { IRouter } from '../../navigation/router/service';
import { provide } from '../../provider';
import { SwitcherOptions } from '../app-switcher/service';
import { IAppSwitcherContext, IAppSwitcherContextKey, AppSwitcherContextDependencies, RunOptions } from './interface';

export * from './interface';

@provide(IAppSwitcherContextKey, 'Constructor')
export class AppSwitcherContext extends ExtensibleEntity implements IAppSwitcherContext {
  public status: ISwitcherStatus[keyof ISwitcherStatus];

  /** 匹配的路由 */
  public readonly matchedRoutes: MatchedRoutes;

  /** cancel 任务的 promise */
  protected readonly _canceledMonitor = createPromiseMonitor<boolean>();

  /** 是否已经 */
  protected _navigationEvent?: Event;

  /** SwitcherContext 运行状态 */
  protected readonly _SwitcherStatus: ISwitcherStatus;

  protected readonly _ActionType: IActionType;

  protected readonly _ActionTargetType: IActionTargetType;

  protected readonly _router: IRouter;

  constructor(
    options: SwitcherOptions,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    { SwitcherStatus, ActionType, ActionTargetType, router }: AppSwitcherContextDependencies,
  ) {
    super(options);
    // 绑定依赖
    this._SwitcherStatus = SwitcherStatus;
    this._ActionType = ActionType;
    this._ActionTargetType = ActionTargetType;
    this._router = router;

    this.matchedRoutes = options.matchedRoutes;
    this._navigationEvent = options.navigationEvent;

    this.status = this._SwitcherStatus.NotStart;
  }

  @memoizePromise(0, false)
  public async run({ renderer }: RunOptions): Promise<void> {
    // await this._loadApps();
    await renderer.render(this.matchedRoutes, async ({ type, apps }) => {
      this._ensureWithoutCancel();
      if (apps?.length) {
        try {
          if (type === this._ActionType.Unmount) {
            await Promise.all(apps.map(async (app) => app.unmount(this)));
          }
        } catch (error) {
          this._resolveCanceledMonitor(false);
          this.status = this._SwitcherStatus.Broken;
          throw error;
        }
      }
    });
  }

  public async cancel(): Promise<void> {
    return Promise.resolve();
  }

  // protected async _loadApps(): Promise<void> {
  //   this._ensureWithoutCancel();

  //   const Status = this._SwitcherStatus;
  //   if (this.status !== Status.NotStart) {
  //     throw new VerseaError(`Can not unmount apps with status "${this.status}".`);
  //   }

  //   this.status = this._SwitcherStatus.LoadingApps;
  //   await this._runSingleTask(this.appsToLoad, async (app) => app.load(this));
  //   this.status = this._SwitcherStatus.NotUnmounted;
  // }

  protected async _runSingleTask(appsList: IApp[][], fn: (app: IApp) => Promise<void>): Promise<void> {
    for (const apps of appsList) {
      this._ensureWithoutCancel();
      try {
        await Promise.all(apps.map(fn));
      } catch (error) {
        this._resolveCanceledMonitor(false);
        this.status = this._SwitcherStatus.Broken;
        throw error;
      }
    }
  }

  protected _ensureWithoutCancel(): void {
    if (this.status === this._SwitcherStatus.WaitForCancel) {
      this._resolveCanceledMonitor(true);
      throw new VerseaCanceledError('Cancel switcher task.');
    }
  }

  protected _resolveCanceledMonitor(cancel: boolean): void {
    this._callEvent();
    this._canceledMonitor.resolve(cancel);
    if (cancel) {
      this.status = this._SwitcherStatus.Canceled;
    }
  }

  protected _callEvent(): void {
    if (this._navigationEvent) {
      this._router.callCapturedEventListeners(this._navigationEvent);
      this._navigationEvent = undefined;
    }
  }
}
