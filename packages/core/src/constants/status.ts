import { provideValue } from '../provider';
import { createServiceSymbol } from '../utils';

export const IStatusEnumKey = createServiceSymbol('IStatusEnum');
export const StatusEnum = {
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
provideValue(StatusEnum, IStatusEnumKey);

type IStatusEnumTyped = typeof StatusEnum;
// 将 IStatusEnum 转换成 interface 导出，方便外部合并类型
/** App 应用状态 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IStatusEnum extends IStatusEnumTyped {}

export const ISwitcherStatusEnumKey = createServiceSymbol('ISwitcherStatusEnum');
export const SwitcherStatusEnum = {
  NotStart: 'NotStart',
  LoadingApps: 'LoadingApps',
  NotUnmounted: 'NotUnmounted',
  Unmounting: 'Unmounting',
  NotMounted: 'NotMounted',
  Mounting: 'Mounting',
  Done: 'Done',
  WaitForCancel: 'WaitForCancel',
  Canceled: 'Canceled',
  Broken: 'Broken',
} as const;
provideValue(SwitcherStatusEnum, ISwitcherStatusEnumKey);

type ISwitcherStatusEnumTyped = typeof SwitcherStatusEnum;
// 将 IStatusEnum 转换成 interface 导出，方便外部合并类型
/** SwitcherContext 运行状态 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ISwitcherStatusEnum extends ISwitcherStatusEnumTyped {}
