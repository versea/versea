import { MatchedRoute } from '../../navigation/route/service';
import { createServiceSymbol } from '../../utils';

export const IAppSwitcherKey = createServiceSymbol('IAppSwitcher');

export interface AppSwitcherOptions {
  routes: MatchedRoute[];
}

export interface IAppSwitcher {
  switch: (options: AppSwitcherOptions) => Promise<void>;
}
