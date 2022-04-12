import { ExtensibleEntity } from '@versea/shared';

import { MatchedResult } from '../../navigation/matcher/service';
import { provide } from '../../provider';
import { IAppSwitcherContext } from '../app-switcher-context/service';
import { ILogicRendererHookContext, ILogicRendererHookContextKey, LogicRendererHookContextOptions } from './interface';

export * from './interface';

@provide(ILogicRendererHookContextKey, 'Constructor')
export class LogicLoaderHookContext extends ExtensibleEntity implements ILogicRendererHookContext {
  public matchedResult: MatchedResult;

  public switcherContext: IAppSwitcherContext;

  public bail = false;

  constructor(options: LogicRendererHookContextOptions) {
    super(options);
    this.matchedResult = options.matchedResult;
    this.switcherContext = options.switcherContext;
  }
}
