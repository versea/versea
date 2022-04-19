import { createServiceSymbol } from '../utils';

export const IStarterKey = createServiceSymbol('IStarter');

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface StartOptions {}

export interface IStarter {
  /** 是否已经执行 start */
  isStarted: boolean;

  /** 启动应用时传入的参数 */
  startOptions: StartOptions;

  /** 启动应用 */
  start: (startOptions: StartOptions) => Promise<void>;
}
