import { IApp } from '../../application/app/service';
import { MatchedRoute } from '../../navigation/route/service';
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
    }
  }

  public appendApps(index: number, apps: IApp[]): void {
    const route = this.current[index];
    if (route) {
      route.apps = [...route.apps, ...apps.filter((app) => !route.apps.includes(app))];
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
