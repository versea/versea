import { provideValue } from '../provider';
import { createServiceSymbol } from '../utils';

export const IActionTypeKey = createServiceSymbol('IActionType');
export const ActionType = {
  BeforeLoad: 'BeforeLoad',
  Load: 'Load',
  Loaded: 'Loaded',
  BeforeUnmount: 'BeforeUnmount',
  Unmount: 'Unmount',
  BeforeUnmountFragment: 'BeforeUnmountFragment',
  Unmounted: 'Unmounted',
  BeforeMount: 'BeforeMount',
  Mount: 'Mount',
  BeforeMountFragment: 'BeforeMountFragment',
  Mounted: 'Mounted',
} as const;
provideValue(ActionType, IActionTypeKey);

type IActionTyped = typeof ActionType;
// 将 IStatus 转换成 interface 导出，方便外部合并类型
/** Action 的类型 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IActionType extends IActionTyped {}

export const IActionTargetTypeKey = createServiceSymbol('IActionTargetType');
export const ActionTargetType = {
  MainApp: 'MainApp',
  Fragment: 'Fragment',
  RootFragment: 'RootFragment',
  Null: 'Null',
} as const;
provideValue(ActionTargetType, IActionTargetTypeKey);

type IActionTargetTyped = typeof ActionTargetType;
// 将 IStatus 转换成 interface 导出，方便外部合并类型
/** Action 的目标类型 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IActionTargetType extends IActionTargetTyped {}
