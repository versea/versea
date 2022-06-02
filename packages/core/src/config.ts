import { provideValue } from './provider';
import { createServiceSymbol } from './utils';

export const IConfig = createServiceSymbol('IConfig');
export interface IConfig {
  /** 路由模式 */
  routerMode: 'hash' | 'history';
}

const config: IConfig = {
  routerMode: 'history',
};

// 再次 provide 时 merge 两份 config
provideValue<IConfig>(config, IConfig, 'ConstantValue', (previous, current) => ({
  ...previous,
  ...current,
}));
