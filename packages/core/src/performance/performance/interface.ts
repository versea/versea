import { MatchedRoute } from '../../navigation/route/service';
import { createServiceSymbol } from '../../utils';

export const IPerformanceKey = createServiceSymbol('IPerformance');

export interface PerformOptions {
  routes: MatchedRoute[];
}

export interface IPerformance {
  perform: (options: PerformOptions) => Promise<void>;
}
