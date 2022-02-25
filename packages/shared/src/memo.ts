// eslint-disable-next-line @typescript-eslint/explicit-function-return-type, @typescript-eslint/explicit-module-boundary-types
export function memoizePromise(index = 0) {
  const promiseMap: Record<string, Promise<unknown> | undefined> = {};
  return function (_target: unknown, _propertyKey: string, descriptor: PropertyDescriptor): void {
    const originValue = descriptor.value as (...args: unknown[]) => Promise<unknown>;
    descriptor.value = async function (...args: unknown[]): Promise<unknown> {
      let key = 'default';
      if (typeof args[index] === 'string' || typeof args[index] === 'number') {
        key = args[index] as string;
      }
      if (promiseMap[key]) {
        return promiseMap[key];
      }
      promiseMap[key] = originValue.call(this, ...args);
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return promiseMap[key]!.finally(() => {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete promiseMap[key];
      });
    };
  };
}
