import { VerseaTimeoutError } from '.';
import { Deferred } from './promise-helper';
import { logWarn } from './utils';

export interface RunWithTimeoutOptions {
  maxTime?: number;
  timeoutMsg?: string;
  dieOnTimeout?: boolean;
}

export enum TimeoutMethodName {
  LOAD = 'load',
  MOUNT = 'mount',
  UNMOUNT = 'unmount',
  WAIT_FOR_CHILD_CONTAINER = 'waitForChildContainer',
}

export type TimeoutConfig = Partial<Record<TimeoutMethodName, RunWithTimeoutOptions>>;

export type TimeoutOptions = RunWithTimeoutOptions & { configName?: TimeoutMethodName };

/**
 * default timeout is 5000ms
 * @param taskPromise
 * @param options
 * @returns
 */
export const promiseWithTimeout = async <T>(
  taskPromise: Promise<T>,
  options: RunWithTimeoutOptions = {},
): Promise<T> => {
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  const { maxTime = 5000, dieOnTimeout = false, timeoutMsg } = options || {};
  const message = timeoutMsg ?? `Task has been timed out for ${maxTime}.`;
  const defer = new Deferred<T>();

  const timer = setTimeout(() => {
    if (dieOnTimeout) {
      defer.reject(new VerseaTimeoutError(message));
    } else {
      logWarn(message);
    }
  }, maxTime);

  void taskPromise
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
};

export function createTimeoutDecorator<T = unknown>(
  processOptions?: (this: T, options: TimeoutOptions & { methodName: string }) => TimeoutOptions,
) {
  return function timeout(options: TimeoutOptions = {}) {
    return function (_target: unknown, methodName: string, descriptor: PropertyDescriptor): void {
      const originValue = descriptor.value as (...args: unknown[]) => Promise<unknown>;

      descriptor.value = async function (...args: unknown[]): Promise<unknown> {
        const finalOptions = processOptions?.call(this as T, { ...options, methodName }) ?? options;

        const taskPromise = originValue.apply(this, args);
        return promiseWithTimeout(taskPromise, finalOptions);
      };
    };
  };
}
