import { ExtensibleEntity } from '@versea/shared';
import { flatten, uniq } from 'ramda';

import { IApp } from '../../application/app/interface';
import { MatchedResult } from '../../navigation/matcher/interface';
import { MatchedRoute } from '../../navigation/route/interface';
import { provide } from '../../provider';
import { IAppSwitcherContext } from '../app-switcher-context/interface';
import { ILoaderHookContext, ILoaderHookContextKey, LoaderHookContextOptions } from './interface';

export * from './interface';

@provide(ILoaderHookContextKey, 'Constructor')
export class LoaderHookContext extends ExtensibleEntity implements ILoaderHookContext {
  public readonly matchedResult: MatchedResult;

  public readonly switcherContext: IAppSwitcherContext;

  public targetApps: IApp[][];

  public currentLoadApps: IApp[] = [];

  public bail = false;

  constructor(options: LoaderHookContextOptions) {
    super(options);
    this.matchedResult = options.matchedResult;
    this.switcherContext = options.switcherContext;
    this.targetApps = this._getTargetApps(this.matchedResult);
  }

  public findMatchedRouteByApp(app: IApp): MatchedRoute | undefined {
    const matchedRoute = this.matchedResult.routes.find((route) => route.apps.includes(app));
    if (matchedRoute) {
      return matchedRoute;
    }
    return this.matchedResult.fragmentRoutes.find((route) => route.apps[0] === app);
  }

  protected _getTargetApps({ routes, fragmentRoutes }: MatchedResult): IApp[][] {
    const apps = flatten(routes.map((route) => route.apps));
    const rootFragmentApps = flatten(fragmentRoutes.map((route) => route.apps));
    const uniqueApps = uniq([...apps, ...rootFragmentApps]);
    return [uniqueApps.filter((app) => !app.isLoaded)].filter((items) => items.length > 0);
  }
}
