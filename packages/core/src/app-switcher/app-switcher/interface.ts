import { IApp } from '../../application/app/service';
import { MatchedResult } from '../../navigation/matcher/service';
import { createServiceSymbol } from '../../utils';
import { IAppSwitcherContext } from '../app-switcher-context/service';

export const IAppSwitcherKey = createServiceSymbol('IAppSwitcher');

export interface SwitcherOptions extends MatchedResult {
  navigationEvent?: Event;
}

export interface IAppSwitcher {
  /** 最新的 context */
  context: IAppSwitcherContext | null;

  /** 当前生效的或正在运行的 context */
  currentContext: IAppSwitcherContext | null;

  /**
   * 当前已经 Mounted 的应用
   * @description 二维数组表示并列和嵌套关系
   */
  readonly currentMountedApps: IApp[][];

  /** 根据匹配路由的结果切换应用 */
  switch: (options: SwitcherOptions) => Promise<void>;
}
