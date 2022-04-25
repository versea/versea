import { createServiceSymbol } from '../../utils';
import { IAppSwitcherContext } from '../app-switcher-context/interface';

export const ILoaderKey = createServiceSymbol('ILoader');

/**
 * Loader
 * @description 仅仅执行加载函数，并不会真实的加载资源文件。
 */
export interface ILoader {
  /** 根据匹配的的路由加载应用 */
  load: (switcherContext: IAppSwitcherContext) => Promise<void>;

  /** 重置为初始状态 */
  restore: () => void;
}
