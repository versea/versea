import { VerseaTimeoutError } from './error';
import { Deferred } from './promise-helper';
import { logWarn } from './utils';

export interface TimeoutOptions {
  millisecond?: number;
  dieOnTimeout?: boolean;
  message?: string;
}

export async function wrapPromise<T>(promise: Promise<T>, options: TimeoutOptions = {}): Promise<T> {
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  const { millisecond = 5000, dieOnTimeout = false, message } = options || {};
  const errorMessage = message ?? `The task has been timed out for ${millisecond}ms.`;
  const defer = new Deferred<T>();

  const timer = setTimeout(() => {
    if (dieOnTimeout) {
      defer.reject(new VerseaTimeoutError(errorMessage));
    } else {
      logWarn(errorMessage);
    }
  }, millisecond);

  void promise
    .then((value) => {
      defer.resolve(value);
    })
    .catch((error) => {
      defer.reject(error);
    })
    .finally(() => {
      if (timer) {
        clearTimeout(timer);
      }
    });

  return defer.promise;
}

export function createTimeoutDecorator<T = unknown, K extends unknown[] = []>(
  getTimeoutOptions?: (instance: T, ...decoratorArgs: K) => TimeoutOptions | undefined,
) {
  return function timeout(...decoratorArgs: K) {
    return function (_target: T, _method: string, descriptor: PropertyDescriptor): void {
      const originValue = descriptor.value as (...args: unknown[]) => Promise<unknown>;

      descriptor.value = async function (...args: unknown[]): Promise<unknown> {
        const options = getTimeoutOptions?.(this as T, ...decoratorArgs);
        return wrapPromise(originValue.apply(this, args), options);
      };
    };
  };
}
