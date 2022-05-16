/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
export function isPromise(target: unknown): target is Promise<unknown> {
  return toString.call(target) === '[object Promise]';
}

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
  return function (_target: unknown, _propertyKey: string, descriptor: PropertyDescriptor): void {
    const originValue = descriptor.value as (...args: unknown[]) => Promise<unknown>;
    descriptor.value = async function (...args: unknown[]): Promise<unknown> {
      // 生成唯一的 promise 存储标识
      let key = 'default';
      if (typeof args[index] === 'string' || typeof args[index] === 'number') {
        key = args[index] as string;
      }
      key = `${_propertyKey}_${key}`;

      // 在类的实例上存储 promise
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

/** Promise 流 */
export function promiseStream<T>(
  promiseList: (Promise<T> | T)[],
  onSuccess: (res: { data: T; index: number }) => unknown,
  onError: (res: { error: Error; index: number }) => unknown,
  onFinally?: () => unknown,
): void {
  let finishedNumber = 0;

  function tryFinished(): void {
    if (++finishedNumber === promiseList.length && onFinally) onFinally();
  }

  promiseList.forEach((p, i) => {
    if (isPromise(p)) {
      p.then((res) => {
        onSuccess({
          data: res,
          index: i,
        });
        tryFinished();
      }).catch((error: Error) => {
        onError({
          error,
          index: i,
        });
        tryFinished();
      });
    } else {
      onSuccess({
        data: p,
        index: i,
      });
      tryFinished();
    }
  });
}
