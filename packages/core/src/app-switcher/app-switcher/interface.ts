import { MatchedRoute } from '../../navigation/route/service';
import { createServiceSymbol } from '../../utils';

export const IAppSwitcherKey = createServiceSymbol('IAppSwitcher');

export interface SwitcherOptions {
  routes: MatchedRoute[];
  navigationEvent?: Event;
}

export interface IAppSwitcher {
  switch: (options: SwitcherOptions) => Promise<void>;
}
