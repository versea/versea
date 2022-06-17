import { provideValue } from '../provider';
import { createServiceSymbol } from '../utils';

export const IStatus = createServiceSymbol('IStatus');
const Status = {
  NotLoaded: 'NotLoaded',
  LoadingSourceCode: 'LoadingSourceCode',
  NotMounted: 'NotMounted',
  Mounting: 'Mounting',
  Mounted: 'Mounted',
  Unmounting: 'Unmounting',
  Unloading: 'Unloading',
  LoadError: 'LoadError',
  Broken: 'Broken',
} as const;
provideValue(Status, IStatus);

type IStatusTyped = typeof Status;
// 将 IStatus 转换成 interface 导出，方便外部合并类型
/** App 应用状态 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IStatus extends IStatusTyped {}

export const ISwitcherStatus = createServiceSymbol('ISwitcherStatus');
const SwitcherStatus = {
  NotStart: 'NotStart',
  Loading: 'Loading',
  Loaded: 'Loaded',
  NotUnmounted: 'NotUnmounted',
  Unmounting: 'Unmounting',
  Unmounted: 'Unmounted',
  NotMounted: 'NotMounted',
  Mounting: 'Mounting',
  Mounted: 'Mounted',
  Done: 'Done',
  WaitForCancel: 'WaitForCancel',
  Canceled: 'Canceled',
  Broken: 'Broken',
} as const;
provideValue(SwitcherStatus, ISwitcherStatus);

type ISwitcherStatusTyped = typeof SwitcherStatus;
// 将 ISwitcherStatus 转换成 interface 导出，方便外部合并类型
/** SwitcherContext 运行状态 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ISwitcherStatus extends ISwitcherStatusTyped {}
