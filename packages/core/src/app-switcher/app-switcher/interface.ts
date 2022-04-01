import { Matched } from '../../navigation/matcher/service';
import { createServiceSymbol } from '../../utils';
import { IAppSwitcherContext } from '../app-switcher-context/service';
import { IRenderer } from '../renderer/service';

export const IAppSwitcherKey = createServiceSymbol('IAppSwitcher');

export interface SwitcherOptions {
  matched: Matched;
  navigationEvent?: Event;
}

export interface IAppSwitcher {
  /** 最新的 context */
  context: IAppSwitcherContext | null;

  /** 当前生效的或正在运行的 context */
  currentContext: IAppSwitcherContext | null;

  readonly renderer: IRenderer;

  /** 根据匹配路由的结果切换应用 */
  switch: (options: SwitcherOptions) => Promise<void>;
}
