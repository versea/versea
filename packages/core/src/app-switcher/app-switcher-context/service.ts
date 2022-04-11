import { ExtensibleEntity, VerseaError, VerseaCanceledError, Deferred, memoizePromise } from '@versea/shared';

import { IApp } from '../../application/app/service';
import { IActionType, IActionTargetType } from '../../constants/action';
import { ISwitcherStatus } from '../../constants/status';
import { MatchedResult } from '../../navigation/matcher/service';
import { IRouter } from '../../navigation/router/service';
import { provide } from '../../provider';
import { SwitcherOptions } from '../app-switcher/service';
import { RendererAction } from '../renderer/action';
import { IAppSwitcherContext, IAppSwitcherContextKey, AppSwitcherContextDependencies, RunOptions } from './interface';

export * from './interface';

@provide(IAppSwitcherContextKey, 'Constructor')
export class AppSwitcherContext extends ExtensibleEntity implements IAppSwitcherContext {
  /** SwitcherContext 运行状态 */
  public status: ISwitcherStatus[keyof ISwitcherStatus];

  /** 匹配的路由 */
  public readonly matchedResult: MatchedResult;

  /** cancel 任务的 promise */
  protected readonly _canceledDeferred = new Deferred<boolean>();

  /** 是否已经 */
  protected _navigationEvent?: Event;

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

    this.matchedResult = options.matchedResult;
    this._navigationEvent = options.navigationEvent;

    this.status = this._SwitcherStatus.NotStart;
  }

  @memoizePromise(0, false)
  public async run({ renderer, logicLoader }: RunOptions): Promise<void> {
    if (this.status !== this._SwitcherStatus.NotStart) {
      throw new VerseaError(`Can not load apps with status "${this.status}".`);
    }

    await logicLoader.load(this);

    if (!this._router.isStarted) {
      // 没有执行过 start，不需要执行 mount 逻辑
      this._resolveCanceledDeferred(false);
      this.status = this._SwitcherStatus.Done;
      return;
    }

    this.status = this._SwitcherStatus.NotUnmounted;
    await renderer.render(this.matchedResult, async (action) => this._handleRendererAction(action));
  }

  public async cancel(): Promise<boolean> {
    if (this.status !== this._SwitcherStatus.Canceled && this.status !== this._SwitcherStatus.Done) {
      this.status = this._SwitcherStatus.WaitForCancel;
    }
    return this._canceledDeferred.promise;
  }

  public async runTransaction<T>(
    fn: () => Promise<T>,
    onError?: (error: unknown) => void,
    onCancel?: () => void,
  ): Promise<T> {
    try {
      this._ensureWithoutCancel(onCancel);
      const result = await fn();
      return result;
    } catch (error) {
      this._resolveCanceledDeferred(false);
      this.status = this._SwitcherStatus.Broken;
      onError?.(error);
      throw error;
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
        await this._runSingleTask(apps!, async (app) => {
          if (!app.isBootstrapped) {
            await app.bootstrap(this);
          }
          return app.mount(this);
        });
      } else {
        this._ensureWithoutCancel();
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        await this._runSingleTask(apps!, async (app, index) => {
          const parent = parents?.[index];
          if (!app.isBootstrapped) {
            await app.bootstrap(this);
          }
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
      this._resolveCanceledDeferred(false);
      this.status = this._SwitcherStatus.Done;
    }
  }

  protected async _runSingleTask(apps: IApp[], fn: (app: IApp, index: number) => Promise<void>): Promise<void> {
    try {
      await Promise.all(apps.map(fn));
    } catch (error) {
      this._resolveCanceledDeferred(false);
      this.status = this._SwitcherStatus.Broken;
      throw error;
    }
  }

  protected _ensureWithoutCancel(onCancel?: () => void): void {
    if (this.status === this._SwitcherStatus.WaitForCancel) {
      onCancel?.();
      this._resolveCanceledDeferred(true);
      throw new VerseaCanceledError('Cancel switcher task.');
    }
  }

  protected _resolveCanceledDeferred(cancel: boolean): void {
    this._callEvent();
    this._canceledDeferred.resolve(cancel);
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
