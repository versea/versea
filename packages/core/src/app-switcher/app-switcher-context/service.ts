import {
  ExtensibleEntity,
  VerseaError,
  VerseaCanceledError,
  createPromiseMonitor,
  memoizePromise,
} from '@versea/shared';

import { IApp } from '../../application/app/service';
import { IActionType, IActionTargetType } from '../../constants/action';
import { ISwitcherStatus } from '../../constants/status';
import { MatchedRoutes } from '../../navigation/matcher/service';
import { IRouter } from '../../navigation/router/service';
import { provide } from '../../provider';
import { SwitcherOptions } from '../app-switcher/service';
import { LoaderAction } from '../loader/action';
import { RendererAction } from '../renderer/action';
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
  public async run({ renderer, loader }: RunOptions): Promise<void> {
    if (this.status !== this._SwitcherStatus.NotStart) {
      throw new VerseaError(`Can not load apps with status "${this.status}".`);
    }

    await loader.load(this.matchedRoutes, async (action) => this._handleLoaderAction(action));
    await renderer.render(this.matchedRoutes, async (action) => this._handleRendererAction(action));
  }

  public async cancel(): Promise<boolean> {
    if (this.status !== this._SwitcherStatus.Canceled && this.status !== this._SwitcherStatus.Done) {
      this.status = this._SwitcherStatus.WaitForCancel;
    }
    return this._canceledMonitor.promise;
  }

  // TODO: Action 相关应该全部换成 hooks
  protected async _handleLoaderAction({ type, apps }: LoaderAction): Promise<void> {
    if (type === this._ActionType.BeforeLoad) {
      this._ensureWithoutCancel();
      this.status = this._SwitcherStatus.LoadingApps;
    }

    if (type === this._ActionType.Load) {
      this._ensureWithoutCancel();
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      await this._runSingleTask(apps!, async (app) => app.load(this));
    }

    if (type === this._ActionType.Loaded) {
      this.status = this._SwitcherStatus.NotUnmounted;
    }
  }

  // TODO: Action 相关应该全部换成 hooks
  protected async _handleRendererAction({ type, targetType, apps, parents }: RendererAction): Promise<void> {
    if (type === this._ActionType.BeforeUnmount) {
      this._ensureWithoutCancel();
      this.status = this._SwitcherStatus.Unmounting;
    }

    if (type === this._ActionType.Unmount) {
      if (targetType !== this._ActionTargetType.RootFragment) {
        this._ensureWithoutCancel();
      }
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      await this._runSingleTask(apps!, async (app) => app.unmount(this));
    }

    if (type === this._ActionType.BeforeUnmountFragment) {
      this._ensureWithoutCancel();
    }

    if (type === this._ActionType.Unmounted) {
      this.status = this._SwitcherStatus.NotMounted;
      this._callEvent();
    }

    if (type === this._ActionType.BeforeMount) {
      this.status = this._SwitcherStatus.Mounting;
    }

    if (type === this._ActionType.Mount) {
      if (targetType === this._ActionTargetType.RootFragment) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        await this._runSingleTask(apps!, async (app) => app.mount(this));
      } else {
        this._ensureWithoutCancel();
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        await this._runSingleTask(apps!, async (app, index) => {
          const parent = parents?.[index];
          if (parent) {
            await parent.waitForChildContainer(app.name, this);
          }
          return app.mount(this);
        });
      }
    }

    if (type === this._ActionType.BeforeMountFragment) {
      this._ensureWithoutCancel();
    }

    if (type === this._ActionType.Mounted) {
      this._resolveCanceledMonitor(false);
      this.status = this._SwitcherStatus.Done;
    }
  }

  protected async _runSingleTask(apps: IApp[], fn: (app: IApp, index: number) => Promise<void>): Promise<void> {
    try {
      await Promise.all(apps.map(fn));
    } catch (error) {
      this._resolveCanceledMonitor(false);
      this.status = this._SwitcherStatus.Broken;
      throw error;
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
