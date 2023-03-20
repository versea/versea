import { provideValue } from './provider';
import { createServiceSymbol } from './utils';

export const IConfig = createServiceSymbol('IConfig');

/**
 * 全局配置
 * @description 作用于整个 Versea 的配置，插件可以额外增加配置
 */
export interface IConfig {
  /** 路由模式 */
  routerMode: 'hash' | 'history';
}

const config: IConfig = {
  routerMode: 'history',
};

// 使用合并策略取代替换策略
// 例如再次执行 `provideValue({ test: 'test' }, IConfig)`，config 的值是 { routerMode: 'history', test: 'test' }
provideValue<IConfig>(config, IConfig, 'ConstantValue', (previous, current) => ({
  ...previous,
  ...current,
}));
