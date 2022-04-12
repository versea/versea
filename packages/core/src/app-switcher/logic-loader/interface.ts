import { createServiceSymbol } from '../../utils';
import { IAppSwitcherContext } from '../app-switcher-context/service';

export const ILogicLoaderKey = createServiceSymbol('ILogicLoader');

/**
 * 逻辑 Loader
 * @description 仅仅执行加载函数，并不会真实的加载资源文件。
 */
export interface ILogicLoader {
  /** 根据匹配的的路由加载应用 */
  load: (switcherContext: IAppSwitcherContext) => Promise<void>;

  /** 重置为初始状态 */
  restore: () => void;
}
