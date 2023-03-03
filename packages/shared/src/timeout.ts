export interface RunWithTimeoutOptions {
  maxTime?: number;
  timeoutCb?: (reject: (reason?: unknown) => void) => void;
  timeoutMsg?: string;
  useReject?: boolean;
}

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
  const { maxTime = 5000, timeoutCb, useReject = true, timeoutMsg } = options || {};

  const timer = new Promise<T>((_, reject) => {
    setTimeout(() => {
      if (timeoutCb) {
        timeoutCb(reject);
      }

      if (useReject) {
        reject(timeoutMsg ?? `Task has been timed out for ${maxTime}.`);
      }
    }, maxTime);
  });

  return Promise.race([timer, taskPromise]);
};
