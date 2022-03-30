import {
  ExtensibleEntity,
  VerseaError,
  VerseaCanceledError,
  createPromiseMonitor,
  memoizePromise,
} from '@versea/shared';
import { flatten } from 'ramda';

import { IApp } from '../../application/app/service';
import { ISwitcherStatusEnum } from '../../constants/status';
import { MatchedRoute } from '../../navigation/route/service';
import { provide } from '../../provider';
import { SwitcherOptions } from '../app-switcher/interface';
import { IAppSwitcherContext, IAppSwitcherContextKey, AppSwitcherContextDependencies } from './interface';

export * from './interface';

@provide(IAppSwitcherContextKey, 'Constructor')
export class AppSwitcherContext extends ExtensibleEntity implements IAppSwitcherContext {
  public appsToLoad: IApp[][] = [];

  public readonly appsToMount: IApp[][] = [];

  public appsToUnmount: IApp[][] = [];

  public currentMountedApps: IApp[][] = [];

  public status: ISwitcherStatusEnum[keyof ISwitcherStatusEnum];

  /** 匹配的路由 */
  public readonly routes: MatchedRoute[];

  /** cancel 任务的 promise */
  protected readonly _canceledMonitor = createPromiseMonitor<boolean>();

  /** SwitcherContext 运行状态 */
  protected readonly _SwitcherStatusEnum: ISwitcherStatusEnum;

  constructor(options: SwitcherOptions, dependencies: AppSwitcherContextDependencies) {
    super(options);
    // 绑定依赖
    this._SwitcherStatusEnum = dependencies.SwitcherStatusEnum;

    this.routes = options.routes;
    this.appsToMount = this._getAppsToMount();

    this.status = this._SwitcherStatusEnum.NotStart;
  }

  @memoizePromise(0, false)
  public async run(): Promise<void> {
    console.log(1);
    return Promise.resolve();
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
    this.status = this._SwitcherStatusEnum.LoadingApps;
    await this._runSingleTask(this.appsToLoad, async (app) => app.load(this));
    this.status = this._SwitcherStatusEnum.NotUnmounted;
  }

  protected async _runSingleTask(appsList: IApp[][], fn: (app: IApp) => Promise<void>): Promise<void> {
    for (const apps of appsList) {
      this._ensureNoCancel();
      try {
        await Promise.all(apps.map(fn));
      } catch (error) {
        this._ensureCalledEvent();
        this._canceledMonitor.resolve(false);
        throw error;
      }
    }
  }

  protected _ensureNoCancel(): void {
    if (this.status === this._SwitcherStatusEnum.WaitForCancel) {
      this._ensureCalledEvent();
      this._canceledMonitor.resolve(true);
      this.status = this._SwitcherStatusEnum.Canceled;
      throw new VerseaCanceledError('Cancel switcher task.');
    }
  }

  protected _ensureCalledEvent(): void {
    console.log(1);
  }

  protected _getAppsToLoad(): IApp[][] {
    const toLoadApps = Array.from(new Set(flatten(this.appsToMount)));
    // 过滤所有没有被加载的应用
    return [toLoadApps.filter((app) => !app.isLoaded)].filter((apps) => apps.length > 0);
  }

  /**
   * 获取需要 unmount 的应用
   * @description 根据 currentMountedApps 和 appsToMount 计算差值，然后再倒序的结果
   * ------
   * 不能直接 unmount 所有当前已经 mounted 的 apps，这样每一次切换路由，cost 很高，我们应该保证最大可复用。也就是尽量减少 unmount 和 mount 的应用。
   *
   * 定义如下差值计算规则（这里方便理解，不进行倒序）
   * - 同行差值法，每个二维数组同一行的第一个元素比较，如果不同，则之后的行全部输出
   *
   * ```
   * [
   *   [A],
   *   [B],
   *   [C],
   * ]
   * // 差值
   * [
   *   [A],
   *   [D],
   *   [E],
   * ]
   * // 等于
   * [
   *   [B],
   *   [C],
   * ]
   * ```
   *
   * - 比较同一行的非第一个元素，得出差集
   *
   * ```
   * [
   *   [A, B, C],
   *   [D],
   * ]
   * // 差值
   * [
   *   [A, C, E],
   *   [D],
   * ]
   * // 等于
   * [
   *   [B],
   * ]
   * ```
   *
   * - 输出结果去除第一列重复的元素
   *
   * ```
   * [
   *   [A],
   *   [A],
   *   [B],
   * ]
   * // 差值
   * [
   *   [A],
   *   [C],
   *   [D],
   * ]
   * // 等于 [[B]]，而不是 [[A], [B]]，因为 A 在上面已经判断相等，所以这里要把 A 去除
   *
   * [
   *   [A],
   *   [A],
   *   [B],
   *   [B],
   *   [C],
   *   [C]
   * ]
   * // 差值
   * [
   *   [A],
   *   [A],
   *   [A],
   * ]
   * // 等于 [[B], [C]]
   * ```
   */
  protected _getAppsToUnmount(): IApp[][] {
    const appsToUnmount: IApp[][] = [];

    if (!this.currentMountedApps.length) {
      return appsToUnmount;
    }

    // 记录从某一行开始需要全部 unmount 的位置
    let breakIndex = -1;

    // 记录上一行第一列相同的 App
    let lastApp: IApp | null = null;

    for (let i = 0; i < this.currentMountedApps.length; i++) {
      const mountedApps = this.currentMountedApps[i];
      const toMountApps = this.appsToMount[i];
      // 同行比较，发现某一行没有 toMountApps，则该行以及之后的行全部加入 unmount 数组
      if (!toMountApps) {
        breakIndex = i;
        break;
      }

      const toUnmountApps: IApp[] = [];
      mountedApps.forEach((app, index) => {
        if (index >= 1 && !toMountApps.includes(app)) {
          toUnmountApps.push(app);
        }
      });

      let toBreak = false;
      // 同行比较，只要发现某一行第一个 App 不一样，则下一行以及之后的行全部加入 unmount 数组
      if (mountedApps[0] !== toMountApps[0]) {
        if (!lastApp || lastApp !== mountedApps[0]) {
          toUnmountApps.unshift(mountedApps[0]);
        }
        breakIndex = i + 1;
        toBreak = true;
      }

      lastApp = mountedApps[0];
      if (toUnmountApps.length) {
        appsToUnmount.push(toUnmountApps);
      }

      if (toBreak) {
        break;
      }
    }

    // breakIndex 开始的行以及之后每一行全部加入 unmount 数组
    if (breakIndex >= 0 && breakIndex < this.currentMountedApps.length) {
      for (let i = breakIndex; i < this.currentMountedApps.length; i++) {
        const mountedApps = this.currentMountedApps[i];
        if (lastApp === mountedApps[0]) {
          const unmountApps = mountedApps.slice(1);
          if (unmountApps.length) {
            appsToUnmount.push(unmountApps);
          }
        } else {
          lastApp = mountedApps[0];
          appsToUnmount.push(mountedApps.slice());
        }
      }
    }

    return appsToUnmount.reverse();
  }

  protected _getAppsToMount(): IApp[][] {
    const appsList = this.routes.map((route) => route.apps);
    this._ensureAppsToMount(appsList);
    return appsList;
  }

  /**
   * 确保 appsToMount 是可以被正确 mount 的
   * @description 仅仅允许第一列主路由应用可以连续重复，不允许间断重复，也不允许其他列有重复的 App
   * ```
   * [
   *   [A, B],
   *   [A],
   *   [C],
   *   [C, D],
   * ] // 正确
   *
   * [
   *   [A, B],
   *   [A],
   *   [C],
   *   [A, D],
   * ] // 不正确，不允许间断重复
   *
   * [
   *   [A, B],
   *   [A],
   *   [C],
   *   [C, A],
   * ] // 不正确，不允许其他列有重复的 App
   * ```
   */
  protected _ensureAppsToMount(appsList: IApp[][]): void {
    if (appsList.length == 0) {
      return;
    }

    const map: WeakMap<IApp, boolean> = new WeakMap();

    function add(app: IApp): void {
      if (map.has(app)) {
        throw new VerseaError(`Matched Routes is invalid, please check routesTree.`);
      }
      map.set(app, true);
    }

    // 获取最大列数
    const length = Math.max.apply(
      null,
      appsList.map((apps) => apps.length),
    );

    // 第一列的 App 可以连续重复
    let lastApp = appsList[0][0];
    appsList.forEach((apps) => {
      const app = apps[0];
      if (app !== lastApp) {
        add(lastApp);
        lastApp = app;
      }
    });
    add(lastApp);

    // 第二列开始不允许重复
    for (let i = 1; i < length; i++) {
      for (const apps of appsList) {
        if (apps[i]) {
          add(apps[i]);
        }
      }
    }
  }
}
