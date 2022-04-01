/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

export interface PromiseMonitor<T> {
  promise: Promise<T>;
  resolve: (value?: PromiseLike<T> | T) => void;
  reject: (reason?: any) => void;
}

export function createPromiseMonitor<T>(): PromiseMonitor<T> {
  let resolveHandler: ((value: PromiseLike<T> | T) => void) | null = null;
  let rejectHandler: ((reason?: any) => void) | null = null;

  const promise = new Promise<T>((resolve, reject) => {
    resolveHandler = resolve;
    rejectHandler = reject;
  });

  return {
    promise,
    resolve: resolveHandler as unknown as (value?: PromiseLike<T> | T) => void,
    reject: rejectHandler as unknown as (reason?: any) => void,
  };
}

export function memoizePromise(index = 0, deleteMemo = true) {
  return function (_target: unknown, _propertyKey: string, descriptor: PropertyDescriptor): void {
    const originValue = descriptor.value as (...args: unknown[]) => Promise<unknown>;
    descriptor.value = async function (...args: unknown[]): Promise<unknown> {
      // 生成唯一的 promise 存储标识
      let key = 'default';
      if (typeof args[index] === 'string' || typeof args[index] === 'number') {
        key = args[index] as string;
      }
      key = `${_propertyKey}_${key}`;

      // promise 存在实例上
      if (!(this as any).__PromiseMemo__) {
        (this as any).__PromiseMemo__ = {};
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const map: Record<string, Promise<unknown> | undefined> = (this as any).__PromiseMemo__;
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
