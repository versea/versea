import {
  ExtensibleEntity,
  VerseaError,
  VerseaCanceledError,
  createPromiseMonitor,
  memoizePromise,
  minusMatrixWithBaseColumn,
  ensureDiffMatrixWithBaseColumn,
} from '@versea/shared';
import { flatten } from 'ramda';

import { IApp } from '../../application/app/service';
import { ISwitcherStatusEnum } from '../../constants/status';
import { MatchedRoute } from '../../navigation/route/service';
import { IRouter } from '../../navigation/router/service';
import { provide } from '../../provider';
import { SwitcherOptions } from '../app-switcher/interface';
import { IAppSwitcherContext, IAppSwitcherContextKey, AppSwitcherContextDependencies } from './interface';

export * from './interface';

@provide(IAppSwitcherContextKey, 'Constructor')
export class AppSwitcherContext extends ExtensibleEntity implements IAppSwitcherContext {
  public appsToLoad: IApp[][] = [];

  public appsToUnmount: IApp[][] = [];

  public readonly appsToMount: IApp[][];

  public currentMountedApps: IApp[][] = [];

  public status: ISwitcherStatusEnum[keyof ISwitcherStatusEnum];

  /** 匹配的路由 */
  public readonly routes: MatchedRoute[];

  /** cancel 任务的 promise */
  protected readonly _canceledMonitor = createPromiseMonitor<boolean>();

  /** 是否已经 */
  protected _navigationEvent?: Event;

  /** SwitcherContext 运行状态 */
  protected readonly _SwitcherStatusEnum: ISwitcherStatusEnum;

  protected readonly _router: IRouter;

  // eslint-disable-next-line @typescript-eslint/naming-convention
  constructor(options: SwitcherOptions, { SwitcherStatusEnum, router }: AppSwitcherContextDependencies) {
    super(options);
    // 绑定依赖
    this._SwitcherStatusEnum = SwitcherStatusEnum;
    this._router = router;

    this.routes = options.routes;
    this._navigationEvent = options.navigationEvent;
    this.appsToMount = this._getAppsToMount();

    this.status = this._SwitcherStatusEnum.NotStart;
  }

  @memoizePromise(0, false)
  public async run(): Promise<void> {
    await this._loadApps();
    await this._unmountApps();
  }

  public async cancel(): Promise<void> {
    return Promise.resolve();
  }

  public syncMountedApps(mountedApps: IApp[][]): void {
    this.currentMountedApps = mountedApps;
    this.appsToLoad = this._getAppsToLoad();
    this.appsToUnmount = this._getAppsToUnmount();
  }

  protected async _loadApps(): Promise<void> {
    this._ensureWithoutCancel();

    const StatusEnum = this._SwitcherStatusEnum;
    if (this.status !== StatusEnum.NotStart) {
      throw new VerseaError(`Can not unmount apps with status "${this.status}".`);
    }

    this.status = this._SwitcherStatusEnum.LoadingApps;
    await this._runSingleTask(this.appsToLoad, async (app) => app.load(this));
    this.status = this._SwitcherStatusEnum.NotUnmounted;
  }

  protected async _unmountApps(): Promise<void> {
    this._ensureWithoutCancel();

    const StatusEnum = this._SwitcherStatusEnum;
    if (this.status !== StatusEnum.NotUnmounted) {
      throw new VerseaError(`Can not unmount apps with status "${this.status}".`);
    }

    this.status = StatusEnum.Unmounting;
    await this._runSingleTask(this.appsToLoad, async (app) => {
      // TODO: add desc currentMountApps
      return app.unmount(this);
    });
    this.status = StatusEnum.NotMounted;
  }

  protected async _runSingleTask(appsList: IApp[][], fn: (app: IApp) => Promise<void>): Promise<void> {
    for (const apps of appsList) {
      this._ensureWithoutCancel();
      try {
        await Promise.all(apps.map(fn));
      } catch (error) {
        this._resolveCanceledMonitor(false);
        this.status = this._SwitcherStatusEnum.Broken;
        throw error;
      }
    }
  }

  protected _ensureWithoutCancel(): void {
    if (this.status === this._SwitcherStatusEnum.WaitForCancel) {
      this._resolveCanceledMonitor(true);
      throw new VerseaCanceledError('Cancel switcher task.');
    }
  }

  protected _resolveCanceledMonitor(cancel: boolean): void {
    this._callEvent();
    this._canceledMonitor.resolve(cancel);
    if (cancel) {
      this.status = this._SwitcherStatusEnum.Canceled;
    }
  }

  protected _callEvent(): void {
    if (this._navigationEvent) {
      this._router.callCapturedEventListeners(this._navigationEvent);
      this._navigationEvent = undefined;
    }
  }

  protected _getAppsToLoad(): IApp[][] {
    const toLoadApps = Array.from(new Set(flatten(this.appsToMount)));
    // 过滤所有没有被加载的应用
    return [toLoadApps.filter((app) => !app.isLoaded)].filter((apps) => apps.length > 0);
  }

  /**
   * 获取需要 unmount 的应用
   * @description 根据 currentMountedApps 和 appsToMount 计算差集的倒序
   *
   * 不能直接 unmount 所有当前已经 mounted 的 apps，否则每一次切换路由，cost 会非常高。我们应该保证最大可复用能力，尽量减少 unmount 和 mount 的应用。
   */
  protected _getAppsToUnmount(): IApp[][] {
    return minusMatrixWithBaseColumn(this.currentMountedApps, this.appsToMount).reverse();
  }

  protected _getAppsToMount(): IApp[][] {
    const appsList = this.routes.map((route) => route.apps);
    this._ensureAppsToMount(appsList);
    return appsList;
  }

  /**
   * 确保 appsToMount 是可以被正确 mount 的
   * @description 只有具有基准列的不重复二维应用数组才能被正确 mount
   */
  protected _ensureAppsToMount(appsList: IApp[][]): void {
    try {
      ensureDiffMatrixWithBaseColumn(appsList);
    } catch {
      throw new VerseaError(`Matched Routes is invalid, please check routesTree.`);
    }
  }
}
