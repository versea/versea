import { MatchedRoute } from '../../navigation/route/service';
import { createServiceSymbol } from '../../utils';

export const IAppSwitcherKey = createServiceSymbol('IAppSwitcher');

export interface SwitcherOptions {
  routes: MatchedRoute[];
}

export interface IAppSwitcher {
  switch: (options: SwitcherOptions) => Promise<void>;
}
