import { ExtensibleEntity, createPromiseMonitor } from '@versea/shared';
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

  public appsToMount: IApp[][] = [];

  public currentMountedApps: IApp[][] = [];

  /** 匹配的路由 */
  protected readonly _routes: MatchedRoute[];

  /** cancel 任务的 promise */
  protected readonly _cancelledMonitor = createPromiseMonitor<boolean>();

  /** SwitcherContext 运行状态 */
  protected readonly _SwitcherStatusEnum: ISwitcherStatusEnum;

  constructor({ routes }: SwitcherOptions, dependencies: AppSwitcherContextDependencies) {
    super();
    this._routes = routes;
    this._SwitcherStatusEnum = dependencies.SwitcherStatusEnum;
    this.appsToLoad = this._getAppsToLoad();
    this.appsToMount = this._getAppsToMount();
  }

  public get appsToUnmount(): IApp[][] {
    return this.appsToMount.reverse();
  }

  public async run(): Promise<void> {
    return Promise.resolve();
  }

  public async cancel(): Promise<void> {
    return Promise.resolve();
  }

  public syncMountedApps(apps: IApp[][]): void {
    this.currentMountedApps = apps;
    // TODO: 在这里计算需要渲染和加载的信息
  }

  protected _getAppsToLoad(): IApp[][] {
    const apps = Array.from(new Set(flatten(this._routes.map((route) => route.apps))));
    return [apps];
  }

  /** 获取需要渲染的应用 */
  protected _getAppsToMount(): IApp[][] {
    const appMap: WeakMap<IApp, boolean> = new WeakMap();
    return this._routes
      .map((route) => {
        return route.apps
          .map((app) => {
            if (appMap.has(app)) {
              return null;
            }
            appMap.set(app, true);
            return app;
          })
          .filter(Boolean) as IApp[];
      })
      .filter((apps) => apps.length > 0);
  }
}
