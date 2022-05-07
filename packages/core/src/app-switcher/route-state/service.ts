import { IApp } from '../../application/app/interface';
import { MatchedRoute, RouteMeta } from '../../navigation/route/interface';
import { provide } from '../../provider';
import { IRouteState, IRouteStateKey } from './interface';

export * from './interface';

@provide(IRouteStateKey)
export class RouteState implements IRouteState {
  public readonly current: MatchedRoute[] = [];

  public readonly currentRootFragments: MatchedRoute[] = [];

  public removeApps(index: number, apps: IApp[]): void {
    const route = this.current[index];
    if (route) {
      const [mainApp, ...fragmentApps] = route.apps;
      route.apps = [mainApp, ...fragmentApps.filter((app) => !apps.includes(app))];

      // 删除碎片应用对应的 meta 信息
      apps.forEach((app) => {
        if (route.meta[app.name]) {
          // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
          delete route.meta[app.name];
        }
      });
    }
  }

  public appendApps(index: number, apps: IApp[], meta: RouteMeta): void {
    const route = this.current[index];
    if (route) {
      route.apps = [...route.apps, ...apps.filter((app) => !route.apps.includes(app))];

      // 增加碎片应用对应的 meta 信息
      apps.forEach((app) => {
        if (meta[app.name]) {
          route.meta[app.name] = meta[app.name];
        }
      });
    }
  }

  public pop(): void {
    this.current.pop();
  }

  public append(route: MatchedRoute, apps?: IApp[]): void {
    const newRoute = route.cloneDeep();
    if (apps?.length) {
      newRoute.apps = apps;
    }
    this.current.push(newRoute);
  }

  public removeRootFragment(route: MatchedRoute): void {
    const index = this.currentRootFragments.indexOf(route);
    if (index >= 0) {
      this.currentRootFragments.splice(index, 1);
    }
  }

  public appendRootFragment(route: MatchedRoute): void {
    this.currentRootFragments.push(route.cloneDeep());
  }
}
