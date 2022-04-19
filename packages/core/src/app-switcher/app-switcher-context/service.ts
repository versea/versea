import { ExtensibleEntity, VerseaError, VerseaCanceledError, Deferred, memoizePromise } from '@versea/shared';

import { ISwitcherStatus } from '../../enum/status';
import { IHooks } from '../../hooks/service';
import { MatchedResult } from '../../navigation/matcher/service';
import { MatchedRoute } from '../../navigation/route/service';
import { IRouter } from '../../navigation/router/service';
import { provide } from '../../provider';
import { IStarter } from '../../starter/interface';
import { SwitcherOptions } from '../app-switcher/service';
import { IRouteState } from '../route-state/service';
import { IAppSwitcherContext, IAppSwitcherContextKey, AppSwitcherContextDependencies, RunOptions } from './interface';

export * from './interface';

@provide(IAppSwitcherContextKey, 'Constructor')
export class AppSwitcherContext extends ExtensibleEntity implements IAppSwitcherContext {
  public status: ISwitcherStatus[keyof ISwitcherStatus];

  public readonly matchedResult: MatchedResult;

  public readonly routeState: IRouteState;

  public bail = false;

  /** 路由事件 */
  protected _navigationEvent?: Event;

  /** cancel 任务的 promise */
  protected readonly _canceledDeferred = new Deferred<boolean>();

  protected readonly _SwitcherStatus: ISwitcherStatus;

  protected readonly _router: IRouter;

<<<<<<< HEAD
  protected readonly _hooks: IHooks;
=======
  protected readonly _starter: IStarter;
>>>>>>> 3d78b85 (feat: add starter)

  constructor(
    options: SwitcherOptions,
    // eslint-disable-next-line @typescript-eslint/naming-convention
<<<<<<< HEAD
    { SwitcherStatus, router, routeState, hooks }: AppSwitcherContextDependencies,
=======
    { SwitcherStatus, router, starter, rendererStore }: AppSwitcherContextDependencies,
>>>>>>> 3d78b85 (feat: add starter)
  ) {
    super(options);
    // 绑定依赖
    this.routeState = routeState;
    this._SwitcherStatus = SwitcherStatus;
    this._router = router;
<<<<<<< HEAD
    this._hooks = hooks;
=======
    this._starter = starter;
    this.rendererStore = rendererStore;
>>>>>>> 3d78b85 (feat: add starter)

    this.matchedResult = options.matchedResult;
    this._navigationEvent = options.navigationEvent;

    this.status = this._SwitcherStatus.NotStart;
  }

  public get currentRoutes(): MatchedRoute[] {
    return this.routeState.current;
  }

  public get currentRootFragmentRoutes(): MatchedRoute[] {
    return this.routeState.currentRootFragments;
  }

  @memoizePromise(0, false)
  public async run({ loader, renderer }: RunOptions): Promise<void> {
    if (this.status !== this._SwitcherStatus.NotStart) {
      throw new VerseaError(`Can not load apps with status "${this.status}".`);
    }

    const resolveCanceled = async (cancel: boolean): Promise<void> => {
      loader.restore();
      renderer.restore();
      try {
        await this._hooks.afterSwitch.call(this);
      } finally {
        this._resolveCanceledDeferred(cancel);
      }
    };

    try {
      await this._hooks.beforeSwitch.call(this);
      await loader.load(this);
      if (this._starter.isStarted) {
        this.status = this._SwitcherStatus.NotUnmounted;
        await renderer.render(this);
      }
    } catch (error) {
      if (error instanceof VerseaCanceledError) {
        this.status = this._SwitcherStatus.Canceled;
        await resolveCanceled(true);
        return;
      }

      this.status = this._SwitcherStatus.Broken;
      await resolveCanceled(false);
      throw error;
    }

    this.status = this._SwitcherStatus.Done;
    await resolveCanceled(false);
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
      throw new VerseaCanceledError('Cancel app switcher task.');
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
  }
}
