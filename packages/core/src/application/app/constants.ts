import { provideValue } from '../../provider';
import { createServiceSymbol } from '../../utils';

export const IStatusEnumKey = createServiceSymbol('IStatusEnum');

const StatusEnum = {
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

export type IStatusEnum = typeof StatusEnum;

provideValue(StatusEnum, IStatusEnumKey);
