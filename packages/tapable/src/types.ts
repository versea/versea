export interface Tap<T extends object, K extends Promise<void> | void> {
  /** 监听函数名称 */
  name: string;

  /** 监听回调函数 */
  fn: (context: T) => K;

  /** 优先级，越小越优先 */
  priority: number;

  /** 是否仅仅执行一次 */
  once?: boolean;
}

export interface TapOptions {
  /** 优先级，越小越优先 */
  priority?: number;

  /**
   * 同名时是否替换回调函数
   * @description 一般不需要传入，紧急需要替换时传 true
   */
  replace?: boolean;

  /** 是否仅仅执行一次 */
  once?: boolean;
}

export interface HookContext {
  cancel?: boolean;
}
