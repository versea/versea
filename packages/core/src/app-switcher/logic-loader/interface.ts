import { createServiceSymbol } from '../../utils';
import { IAppSwitcherContext } from '../app-switcher-context/service';

export const ILogicLoaderKey = createServiceSymbol('ILogicLoader');

export interface ILogicLoader {
  /** 根据匹配的的路由加载应用 */
  load: (switcherContext: IAppSwitcherContext) => Promise<void>;
}
