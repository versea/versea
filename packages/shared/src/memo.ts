// eslint-disable-next-line @typescript-eslint/explicit-function-return-type, @typescript-eslint/explicit-module-boundary-types
export function memoizePromise() {
  let promise: Promise<unknown> | null = null;
  return function (_target: unknown, _propertyKey: string, descriptor: PropertyDescriptor): void {
    const originValue = descriptor.value as (...args: unknown[]) => Promise<unknown>;
    descriptor.value = async function (...args: unknown[]): Promise<unknown> {
      if (promise) {
        return promise;
      }
      promise = originValue.call(this, ...args);
      return promise.finally(() => {
        promise = null;
      });
    };
  };
}
