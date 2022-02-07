export function memoizePromise(): (_target: unknown, _propertyKey: string, descriptor: PropertyDescriptor) => void {
  let promise: Promise<unknown> | null = null;
  return function (_target: unknown, _propertyKey: string, descriptor: PropertyDescriptor): void {
    const originValue = descriptor.value as (...args: unknown[]) => Promise<unknown>;
    descriptor.value = async function (...args: unknown[]): Promise<unknown> {
      if (promise) {
        return promise;
      }
      promise = originValue(...args);
      return promise.finally(() => {
        promise = null;
      });
    };
  };
}
