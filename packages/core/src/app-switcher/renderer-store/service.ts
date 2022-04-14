import { IApp } from '../../application/app/service';
import { MatchedRoute } from '../../navigation/route/service';
import { provide } from '../../provider';
import { IRendererStore, IRendererStoreKey } from './interface';

export * from './interface';

@provide(IRendererStoreKey)
export class RendererStore implements IRendererStore {
  public readonly currentRoutes: MatchedRoute[] = [];

  public readonly currentRootFragmentRoutes: MatchedRoute[] = [];

  public removeApps(index: number, apps: IApp[]): void {
    const currentRoute = this.currentRoutes[index];
    if (currentRoute) {
      const [mainApp, ...fragmentApps] = currentRoute.apps;
      currentRoute.apps = [mainApp, ...fragmentApps.filter((app) => !apps.includes(app))];
    }
  }

  public removeRoute(index: number): void {
    if (index >= 0 && index < this.currentRoutes.length) {
      this.currentRoutes.splice(index, 1);
    }
  }

  public removeRootFragmentRoute(route: MatchedRoute): void {
    const currentRootFragmentRoutes = this.currentRootFragmentRoutes;
    const index = currentRootFragmentRoutes.indexOf(route);
    if (index >= 0) {
      currentRootFragmentRoutes.splice(index, 1);
    }
  }

  public appendRoute(route: MatchedRoute, apps?: IApp[]): void {
    const currentRoute = route.cloneDeep();
    if (apps?.length) {
      currentRoute.apps = apps;
    }
    this.currentRoutes.push(currentRoute);
  }

  public setApps(index: number, apps: IApp[]): void {
    if (index >= 0 && index < this.currentRoutes.length) {
      this.currentRoutes[index].apps = apps;
    }
  }

  public appendRootFragmentRoute(route: MatchedRoute): void {
    this.currentRootFragmentRoutes.push(route.cloneDeep());
  }
}
