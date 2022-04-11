import { provideValue } from '../provider';
import { createServiceSymbol } from '../utils';

export const IStatusKey = createServiceSymbol('IStatus');
export const Status = {
  NotLoaded: 'NotLoaded',
  LoadingSourceCode: 'LoadingSourceCode',
  NotBootstrapped: 'NotBootstrapped',
  Bootstrapping: 'Bootstrapping',
  NotMounted: 'NotMounted',
  Mounting: 'Mounting',
  Mounted: 'Mounted',
  Unmounting: 'Unmounting',
  Unloading: 'Unloading',
  LoadError: 'LoadError',
  Broken: 'Broken',
} as const;
provideValue(Status, IStatusKey);

type IStatusTyped = typeof Status;
// 将 IStatus 转换成 interface 导出，方便外部合并类型
/** App 应用状态 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IStatus extends IStatusTyped {}

export const ISwitcherStatusKey = createServiceSymbol('ISwitcherStatus');
export const SwitcherStatus = {
  NotStart: 'NotStart',
  Loading: 'Loading',
  Loaded: 'Loaded',
  NotUnmounted: 'NotUnmounted',
  Unmounting: 'Unmounting',
  NotMounted: 'NotMounted',
  Mounting: 'Mounting',
  Done: 'Done',
  WaitForCancel: 'WaitForCancel',
  Canceled: 'Canceled',
  Broken: 'Broken',
} as const;
provideValue(SwitcherStatus, ISwitcherStatusKey);

type ISwitcherStatusTyped = typeof SwitcherStatus;
// 将 ISwitcherStatus 转换成 interface 导出，方便外部合并类型
/** SwitcherContext 运行状态 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ISwitcherStatus extends ISwitcherStatusTyped {}
