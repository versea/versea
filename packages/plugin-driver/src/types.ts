/* eslint-disable @typescript-eslint/no-explicit-any */
export enum TapType {
  SYNC = 'SYNC',
  ASYNC = 'ASYNC',
  PROMISE = 'PROMISE',
}

export interface Tap {
  /** 类型，不需要传 */
  type?: string;
  /** tap名称 */
  name: string;
  /** 回调 */
  fn?: (...args: string[]) => void;
  /** 再某些tap之前执行 */
  before?: string[] | string;
  /** 选择tap插入的优先级，越小越优先 */
  stage?: number;
}

export interface Interceptor {
  /** call前钩子 */
  call?: (...args: string[]) => void;
  /** 注册拦截，可修改tap */
  register?: (tap: Tap) => Tap;
  /** 每个tap回调前的钩子 */
  tap?: (tap: Tap) => void;
  /** 循环函数的钩子 */
  loop?: (...args: string[]) => void;
}

export interface CompileOptions {
  taps: Tap[];
  interceptors: Interceptor[];
  args: any[];
  type: TapType;
}

export type ArgsFunction = (...args: any[]) => any;
export type ArgsVoidFunction = (...args: any[]) => void;
export type ArgsPromiseFunction = (...args: any[]) => Promise<any>;
