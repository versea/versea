import { ExtensibleEntity } from '@versea/shared';

import { IApp } from '../../application/app/service';
import { MatchedRoute } from '../../navigation/route/service';
import { provide } from '../../provider';
import { SwitcherOptions } from '../app-switcher/service';
import { IAppSwitcherContext, IAppSwitcherContextKey } from './interface';

export * from './interface';

@provide(IAppSwitcherContextKey, 'Constructor')
export class AppSwitcherContext extends ExtensibleEntity implements IAppSwitcherContext {
  public appsToLoad: IApp[][] = [];

  public appsToMount: IApp[][] = [];

  protected routes: MatchedRoute[];

  constructor(options: SwitcherOptions) {
    super();
    this.routes = options.routes;
    this.appsToLoad = this.getAppsToLoad();
    this.appsToMount = this.getAppsToMount();
  }

  public get appsToUnmount(): IApp[][] {
    return this.appsToMount.reverse();
  }

  protected getAppsToLoad(): IApp[][] {
    const apps = Array.from(new Set(this.routes.map((route) => route.apps).flat()));
    return [apps];
  }

  /**
   * 获取需要渲染的应用
   */
  protected getAppsToMount(): IApp[][] {
    const appMap: WeakMap<IApp, boolean> = new WeakMap();
    return this.routes
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
