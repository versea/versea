import { createServiceSymbol } from '@versea/core';

export const ICurrentApp = createServiceSymbol('ICurrentApp');

/** 记录正在执行同步代码的应用 */
export interface ICurrentApp {
  /** 获取正在执行的应用 */
  getName: () => string | undefined;

  /** 设置正在执行的应用 */
  setName: (name?: string) => void;

  /** 设置正在执行的应用，并且在异步任务删除这个记录 */
  throttleDeferForSetAppName: (name: string) => void;
}
