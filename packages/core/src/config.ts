import { provideValue } from './provider';
import { createServiceSymbol } from './utils';

export const IConfigKey = createServiceSymbol('IConfig');
export interface IConfig {
  routerMode: 'hash' | 'history';
}

const config: IConfig = {
  routerMode: 'history',
};

// 再次 provide 时 merge 两份 config
provideValue<IConfig>(config, IConfigKey, 'ConstantValue', (previous, current) => ({
  ...previous,
  ...current,
}));
