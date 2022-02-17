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
  SkipBecauseBroken: 'SkipBecauseBroken',
} as const;

type IStatusEnumTyped = typeof StatusEnum;

// 将 IStatusEnum 转换成 interface 导出，方便外部合并类型
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IStatusEnum extends IStatusEnumTyped {}

provideValue(StatusEnum, IStatusEnumKey);
