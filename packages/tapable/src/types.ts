export interface Tap<T extends object, K extends Promise<void> | void> {
  /** 监听名称 */
  name: string;

  /** 监听函数 */
  fn: (context: T) => K;

  /** 优先级，越小优先级越高，可以设置负数 */
  priority: number;
}

export interface TapOptions {
  /** 在某个监听者之前 */
  before?: string;

  /** 在某个监听者之后 */
  after?: string;

  /** 优先级，越小优先级越高，可以设置负数 */
  priority?: number;

  /**
   * 监听名称同名时是否替换原函数
   * @description 推荐不传入这个参数，仅仅你非常确信你要这么做
   */
  replace?: boolean;

  /** 是否仅仅执行一次 */
  once?: boolean;
}

export interface HookContext {
  /**
   * 熔断
   * @description 设置为 true 则会取消后续所有 Tap 执行。
   */
  bail?: boolean;

  /**
   * 忽略监听者
   * @description 根据设置的监听者名称忽略某些监听者本次事件不执行
   */
  ignoreTap?: string[];
}
