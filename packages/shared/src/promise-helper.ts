export interface PromiseMonitor<T> {
  promise: Promise<T>;
  resolve: (value?: PromiseLike<T> | T) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  reject: (reason?: any) => void;
}

export function createPromiseMonitor<T>(): PromiseMonitor<T> {
  let resolveHandler: ((value: PromiseLike<T> | T) => void) | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let rejectHandler: ((reason?: any) => void) | null = null;

  const promise = new Promise<T>((resolve, reject) => {
    resolveHandler = resolve;
    rejectHandler = reject;
  });

  return {
    promise,
    resolve: resolveHandler as unknown as (value?: PromiseLike<T> | T) => void,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    reject: rejectHandler as unknown as (reason?: any) => void,
  };
}
