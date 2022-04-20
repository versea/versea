import { ExtensibleEntity, VerseaError, VerseaCanceledError, Deferred, memoizePromise } from '@versea/shared';

import { ISwitcherStatus } from '../../enum/status';
import { MatchedResult } from '../../navigation/matcher/service';
import { MatchedRoute } from '../../navigation/route/service';
import { IRouter } from '../../navigation/router/service';
import { provide } from '../../provider';
import { SwitcherOptions } from '../app-switcher/service';
import { IRouteState } from '../route-state/service';
import { IAppSwitcherContext, IAppSwitcherContextKey, AppSwitcherContextDependencies, RunOptions } from './interface';

export * from './interface';

@provide(IAppSwitcherContextKey, 'Constructor')
export class AppSwitcherContext extends ExtensibleEntity implements IAppSwitcherContext {
  public status: ISwitcherStatus[keyof ISwitcherStatus];

  public readonly matchedResult: MatchedResult;

  public readonly routeState: IRouteState;

  /** 路由事件 */
  protected _navigationEvent?: Event;

  /** cancel 任务的 promise */
  protected readonly _canceledDeferred = new Deferred<boolean>();

  protected readonly _SwitcherStatus: ISwitcherStatus;

  protected readonly _router: IRouter;

  constructor(
    options: SwitcherOptions,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    { SwitcherStatus, router, routeState }: AppSwitcherContextDependencies,
  ) {
    super(options);
    // 绑定依赖
    this._SwitcherStatus = SwitcherStatus;
    this._router = router;
    this.routeState = routeState;

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

    const restoreAndResolveCanceled = (cancel: boolean): void => {
      loader.restore();
      renderer.restore();
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
    if (cancel) {
      this.status = this._SwitcherStatus.Canceled;
    }
  }
}
