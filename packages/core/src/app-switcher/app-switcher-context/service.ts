import { ExtensibleEntity, VerseaError, VerseaCanceledError, Deferred, memoizePromise } from '@versea/shared';

import { ISwitcherStatus } from '../../constants/status';
import { MatchedResult } from '../../navigation/matcher/service';
import { MatchedRoute } from '../../navigation/route/service';
import { IRouter } from '../../navigation/router/service';
import { provide } from '../../provider';
import { SwitcherOptions } from '../app-switcher/service';
import { IRendererStore } from '../renderer-store/service';
import { IAppSwitcherContext, IAppSwitcherContextKey, AppSwitcherContextDependencies, RunOptions } from './interface';

export * from './interface';

@provide(IAppSwitcherContextKey, 'Constructor')
export class AppSwitcherContext extends ExtensibleEntity implements IAppSwitcherContext {
  /** SwitcherContext 运行状态 */
  public status: ISwitcherStatus[keyof ISwitcherStatus];

  /** 匹配的路由 */
  public readonly matchedResult: MatchedResult;

  public readonly rendererStore: IRendererStore;

  /** 路由事件 */
  protected _navigationEvent?: Event;

  /** cancel 任务的 promise */
  protected readonly _canceledDeferred = new Deferred<boolean>();

  protected readonly _SwitcherStatus: ISwitcherStatus;

  protected readonly _router: IRouter;

  constructor(
    options: SwitcherOptions,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    { SwitcherStatus, router, rendererStore }: AppSwitcherContextDependencies,
  ) {
    super(options);
    // 绑定依赖
    this._SwitcherStatus = SwitcherStatus;
    this._router = router;
    this.rendererStore = rendererStore;

    this.matchedResult = options.matchedResult;
    this._navigationEvent = options.navigationEvent;

    this.status = this._SwitcherStatus.NotStart;
  }

  public get currentRoutes(): MatchedRoute[] {
    return this.rendererStore.currentRoutes;
  }

  public get currentRootFragmentRoutes(): MatchedRoute[] {
    return this.rendererStore.currentRootFragmentRoutes;
  }

  @memoizePromise(0, false)
  public async run({ renderer, loader }: RunOptions): Promise<void> {
    if (this.status !== this._SwitcherStatus.NotStart) {
      throw new VerseaError(`Can not load apps with status "${this.status}".`);
    }

    const restoreAndResolveCanceled = (cancel: boolean): void => {
      renderer.restore();
      loader.restore();
      this._resolveCanceledDeferred(cancel);
    };

    try {
      await loader.load(this);
      if (this._router.isStarted) {
        this.status = this._SwitcherStatus.NotUnmounted;
        await renderer.render(this);
      }
    } catch (error) {
      if (error instanceof VerseaCanceledError) {
        restoreAndResolveCanceled(true);
        return;
      }

      restoreAndResolveCanceled(false);
      this.status = this._SwitcherStatus.Broken;
      throw error;
    }

    restoreAndResolveCanceled(false);
    this.status = this._SwitcherStatus.Done;
  }

  public async cancel(): Promise<boolean> {
    if (this.status !== this._SwitcherStatus.Canceled && this.status !== this._SwitcherStatus.Done) {
      this.status = this._SwitcherStatus.WaitForCancel;
    }
    return this._canceledDeferred.promise;
  }

  public async runTask<T>(fn: () => Promise<T>): Promise<T> {
    this.ensureNotCanceled();
    return fn();
  }

  public ensureNotCanceled(): void {
    if (this.status === this._SwitcherStatus.WaitForCancel) {
      throw new VerseaCanceledError('Cancel switcher task.');
    }
  }

  public callEvent(): void {
    if (this._navigationEvent) {
      this._router.callCapturedEventListeners(this._navigationEvent);
      this._navigationEvent = undefined;
    }
  }

  protected _resolveCanceledDeferred(cancel: boolean): void {
    this.callEvent();
    this._canceledDeferred.resolve(cancel);
    if (cancel) {
      this.status = this._SwitcherStatus.Canceled;
    }
  }

  // TODO: Action 相关应该全部换成 hooks
  // protected async _handleRendererAction({ type, targetType, apps, parents }: RendererAction): Promise<void> {
  //   if (type === this._ActionType.BeforeUnmount) {
  //     this._ensureNotCanceled();
  //     this.status = this._SwitcherStatus.Unmounting;
  //   }

  //   if (type === this._ActionType.Unmount) {
  //     if (targetType !== this._ActionTargetType.RootFragment) {
  //       this._ensureNotCanceled();
  //     }
  //     // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  //     await this._runSingleTask(apps!, async (app) => app.unmount(this));
  //   }

  //   if (type === this._ActionType.BeforeUnmountFragment) {
  //     this._ensureNotCanceled();
  //   }

  //   if (type === this._ActionType.Unmounted) {
  //     this.status = this._SwitcherStatus.NotMounted;
  //     this._callEvent();
  //   }

  //   if (type === this._ActionType.BeforeMount) {
  //     this.status = this._SwitcherStatus.Mounting;
  //   }

  //   if (type === this._ActionType.Mount) {
  //     if (targetType === this._ActionTargetType.RootFragment) {
  //       // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  //       await this._runSingleTask(apps!, async (app) => {
  //         if (!app.isBootstrapped) {
  //           await app.bootstrap(this);
  //         }
  //         return app.mount(this);
  //       });
  //     } else {
  //       this._ensureNotCanceled();
  //       // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  //       await this._runSingleTask(apps!, async (app, index) => {
  //         const parent = parents?.[index];
  //         if (!app.isBootstrapped) {
  //           await app.bootstrap(this);
  //         }
  //         if (parent) {
  //           await parent.waitForChildContainer(app.name, this);
  //         }
  //         return app.mount(this);
  //       });
  //     }
  //   }

  //   if (type === this._ActionType.BeforeMountFragment) {
  //     this._ensureNotCanceled();
  //   }

  //   if (type === this._ActionType.Mounted) {
  //     this._resolveCanceledDeferred(false);
  //     this.status = this._SwitcherStatus.Done;
  //   }
  // }
}
