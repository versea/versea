import { TimeoutConfig, TimeoutMethodName } from '@versea/shared';

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

  /** 任务超时配置 */
  timeoutConfig: TimeoutConfig;
}

const config: IConfig = {
  routerMode: 'history',
  timeoutConfig: {
    [TimeoutMethodName.LOAD]: {
      maxTime: 3000,
      dieOnTimeout: false,
      timeoutMsg: 'Time out for loading app resources.',
    },
    [TimeoutMethodName.MOUNT]: {
      maxTime: 3000,
      dieOnTimeout: false,
      timeoutMsg: 'Time out for mounting app.',
    },
    [TimeoutMethodName.UNMOUNT]: {
      maxTime: 3000,
      dieOnTimeout: false,
      timeoutMsg: 'Time out for unmounting app.',
    },
    [TimeoutMethodName.WAIT_FOR_CHILD_CONTAINER]: {
      maxTime: 3000,
      dieOnTimeout: false,
      timeoutMsg: 'Time out for waiting app container.',
    },
  },
};

// 使用合并策略取代替换策略
// 例如再次执行 `provideValue({ test: 'test' }, IConfig)`，config 的值是 { routerMode: 'history', test: 'test' }
provideValue<IConfig>(config, IConfig, 'ConstantValue', (previous, current) => ({
  ...previous,
  ...current,
}));
