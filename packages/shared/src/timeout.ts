export interface RunWithTimeoutOptions {
  maxTime?: number;
  timeoutCb?: (taskName: string, reject: (reason?: unknown) => void) => void;
  useReject?: boolean;
}

export const runWithTimeout = async <T>(
  task: (...args: unknown[]) => Promise<T>,
  options: RunWithTimeoutOptions = {},
): Promise<Awaited<T> | string> => {
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  const { maxTime = 5000, timeoutCb, useReject = true } = options || {};

  const timer = new Promise<string>((_, reject) => {
    setTimeout(() => {
      if (timeoutCb) {
        timeoutCb(task.name, reject);
      }

      if (useReject) {
        reject(`Task ${task.name} has timed out for ${maxTime}.`);
      }
    }, maxTime);
  });

  return Promise.race([timer, task()]);
};
