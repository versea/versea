import { VerseaTimeoutError } from './error';
import { logWarn } from './utils';

export interface RunWithTimeoutOptions {
  maxTime?: number;
  timeoutMsg?: string;
  dieOnTimeout?: boolean;
}

export enum TimeoutMethodName {
  LOAD = 'load',
  MOUNT = 'mount',
  WAIT_FOR_CHILD_CONTAINER = 'waitForChildContainer',
}

export type TimeoutConfig = Record<TimeoutMethodName, RunWithTimeoutOptions>;

/**
 * default timeout is 5000ms
 * @param taskPromise
 * @param options
 * @returns
 */
export const promiseWithTimeout = async <T>(
  taskPromise: Promise<T>,
  options: RunWithTimeoutOptions = {},
): Promise<Awaited<T>> => {
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  const { maxTime = 5000, dieOnTimeout = true, timeoutMsg } = options || {};
  const message = timeoutMsg ?? `Task has been timed out for ${maxTime}.`;

  let timer: NodeJS.Timeout | null = null;
  const timerPromise = new Promise<T>((_, reject) => {
    timer = setTimeout(() => {
      reject(new VerseaTimeoutError(message));
    }, maxTime);
  });

  try {
    return await Promise.race([timerPromise, taskPromise]);
  } catch (error) {
    const isTimeoutError = error instanceof VerseaTimeoutError;

    if (isTimeoutError) {
      if (dieOnTimeout) {
        throw error;
      } else {
        logWarn(message);
        return await taskPromise;
      }
    }

    // throw the error from the task promise
    throw error;
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
};

export function timeout(options: RunWithTimeoutOptions & { configName?: TimeoutMethodName } = {}) {
  return function (_target: Record<string, unknown>, methodName: string, descriptor: PropertyDescriptor): void {
    const originValue = descriptor.value as (...args: unknown[]) => Promise<unknown>;

    const config = (_target._timeoutConfig ?? {}) as TimeoutConfig;

    // options priority: options -> options from config by given configName -> options from config by the raw method name
    const finalOptions = {
      ...(config[(options?.configName ?? methodName) as TimeoutMethodName] ?? {}),
      ...options,
    };

    descriptor.value = async function (...args: unknown[]): Promise<unknown> {
      const taskPromise = originValue.apply(this, args);
      return promiseWithTimeout(taskPromise, finalOptions);
    };
  };
}
