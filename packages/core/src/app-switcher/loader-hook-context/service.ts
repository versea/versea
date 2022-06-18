import { ExtensibleEntity } from '@versea/shared';
import { flatten, uniq } from 'ramda';

import { IApp } from '../../application/app/interface';
import { MatchedResult } from '../../navigation/matcher/interface';
import { provide } from '../../provider';
import { IAppSwitcherContext } from '../app-switcher-context/interface';
import { ILoaderHookContext, LoaderHookContextOptions } from './interface';

export * from './interface';

@provide(ILoaderHookContext, 'Constructor')
export class LoaderHookContext extends ExtensibleEntity implements ILoaderHookContext {
  public readonly switcherContext: IAppSwitcherContext;

  public readonly matchedResult: MatchedResult;

  public apps: IApp[];

  constructor(options: LoaderHookContextOptions) {
    super(options);
    this.matchedResult = options.matchedResult;
    this.switcherContext = options.switcherContext;
    this.apps = this._getApps(this.matchedResult);
  }

  protected _getApps({ routes, fragmentRoutes }: MatchedResult): IApp[] {
    const apps = flatten(routes.map((route) => route.apps));
    const rootFragmentApps = flatten(fragmentRoutes.map((route) => route.apps));
    return uniq([...apps, ...rootFragmentApps]).filter((app) => !app.isLoaded);
  }
}
