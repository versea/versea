import { ExtensibleEntity } from '@versea/shared';
import { flatten, uniq } from 'ramda';

import { IApp } from '../../application/app/service';
import { MatchedResult } from '../../navigation/matcher/service';
import { provide } from '../../provider';
import { IAppSwitcherContext } from '../app-switcher-context/service';
import { ILogicLoaderHookContext, ILogicLoaderHookContextKey, LogicLoaderHookContextOptions } from './interface';

export * from './interface';

@provide(ILogicLoaderHookContextKey, 'Constructor')
export class LogicLoaderHookContext extends ExtensibleEntity implements ILogicLoaderHookContext {
  public readonly matchedResult: MatchedResult;

  public readonly switcherContext: IAppSwitcherContext;

  public targetApps: IApp[][];

  public currentLoadApps: IApp[] = [];

  public bail = false;

  constructor(options: LogicLoaderHookContextOptions) {
    super(options);
    this.matchedResult = options.matchedResult;
    this.switcherContext = options.switcherContext;
    this.targetApps = this._getTargetApps(this.matchedResult);
  }

  protected _getTargetApps({ routes, fragmentRoutes }: MatchedResult): IApp[][] {
    const apps = flatten(routes.map((route) => route.apps));
    const rootFragmentApps = flatten(fragmentRoutes.map((route) => route.apps));
    const uniqueApps = uniq([...apps, ...rootFragmentApps]);
    return [uniqueApps.filter((app) => !app.isLoaded)].filter((items) => items.length > 0);
  }
}
