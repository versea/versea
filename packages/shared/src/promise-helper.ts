/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
export class Deferred<T> {
  public promise: Promise<T>;

  public resolve!: (value: PromiseLike<T> | T) => void;

  public reject!: (reason?: any) => void;

  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }
}

/** 缓存 Promise 实例直到该 Promise 执行完成 */
export function memoizePromise(index = 0, deleteMemo = true) {
  return function (_target: unknown, propertyKey: string, descriptor: PropertyDescriptor): void {
    const originValue = descriptor.value as (...args: unknown[]) => Promise<unknown>;
    descriptor.value = async function (
      // eslint-disable-next-line @typescript-eslint/naming-convention
      this: { __PromiseMemo__: Record<string, Promise<unknown> | undefined> },
      ...args: unknown[]
    ): Promise<unknown> {
      // 生成唯一的 promise 存储标识
      let key = 'default';
      if (typeof args[index] === 'string' || typeof args[index] === 'number') {
        key = args[index] as string;
      }

      key = `${propertyKey}_${key}`;

      // 在类的实例上存储 promise
      if (!this.__PromiseMemo__) {
        this.__PromiseMemo__ = {};
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const map: Record<string, Promise<unknown> | undefined> = this.__PromiseMemo__;
      if (map[key]) {
        return map[key];
      }

      map[key] = originValue.call(this, ...args);
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return map[key]!.finally(() => {
        if (deleteMemo) {
          // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
          delete map[key];
        }
      });
    };
  };
}
