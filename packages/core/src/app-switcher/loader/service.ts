import { inject } from 'inversify';
import { flatten, uniq } from 'ramda';

import { IApp } from '../../application/app/service';
import { IActionTargetType, IActionTargetTypeKey, IActionType, IActionTypeKey } from '../../constants/action';
import { MatchedRoutes } from '../../navigation/matcher/service';
import { provide } from '../../provider';
import { LoaderActionHandler } from './action';
import { ILoader, ILoaderKey } from './interface';

export * from './action';
export * from './interface';

@provide(ILoaderKey)
export class Loader implements ILoader {
  protected readonly _ActionType: IActionType;

  protected readonly _ActionTargetType: IActionTargetType;

  constructor(
    // eslint-disable-next-line @typescript-eslint/naming-convention
    @inject(IActionTypeKey) ActionType: IActionType,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    @inject(IActionTargetTypeKey) ActionTargetType: IActionTargetType,
  ) {
    this._ActionType = ActionType;
    this._ActionTargetType = ActionTargetType;
  }

  public async load(matchedRoutes: MatchedRoutes, onAction: LoaderActionHandler): Promise<void> {
    const uniqueAppMatrix = this._getUniqueAppMatrix(matchedRoutes);

    await onAction({
      type: this._ActionType.BeforeLoad,
      targetType: this._ActionTargetType.Null,
    });

    for (const apps of uniqueAppMatrix) {
      if (apps.length > 0) {
        await onAction({
          type: this._ActionType.Load,
          targetType: this._ActionTargetType.Null,
          apps,
        });
      }
    }

    await onAction({
      type: this._ActionType.Loaded,
      targetType: this._ActionTargetType.Null,
    });
  }

  protected _getUniqueAppMatrix({ routes, fragmentRoutes }: MatchedRoutes): IApp[][] {
    const apps = flatten(routes.map((route) => route.apps));
    const rootFragmentApps = flatten(fragmentRoutes.map((route) => route.apps));
    const uniqueApps = uniq([...apps, ...rootFragmentApps]);
    const uniqueToLoadApps = uniqueApps.filter((app) => !app.isLoaded);
    return [uniqueToLoadApps];
  }
}
