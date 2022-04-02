import { MatchedRoutes } from '../../navigation/matcher/service';
import { createServiceSymbol } from '../../utils';
import { LoaderActionHandler } from './action';

export const ILoaderKey = createServiceSymbol('ILoader');

export interface ILoader {
  /** 根据匹配的的路由加载应用 */
  load: (matchedRoutes: MatchedRoutes, onAction: LoaderActionHandler) => Promise<void>;
}
