import { IAppSwitcher } from '../../app-switcher/app-switcher/service';
import { createServiceSymbol } from '../../utils';

export const IRouterStarterKey = createServiceSymbol('IRouterStarter');

export interface IRouterStarter {
  /** 是否已经执行 start */
  isStarted: boolean;

  /** 启动应用 */
  start: (appSwitcher: IAppSwitcher) => Promise<void>;
}
