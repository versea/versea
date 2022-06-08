function isString(target: unknown): target is string {
  return typeof target === 'string';
}

export function isPromise(target: unknown): target is Promise<unknown> {
  return toString.call(target) === '[object Promise]';
}

export const isBrowser = typeof window !== 'undefined';

export const requestIdleCallback =
  window.requestIdleCallback ||
  function requestIdleCallback(cb: IdleRequestCallback): number {
    const start = Date.now();
    return window.setTimeout(() => {
      cb({
        didTimeout: false,
        timeRemaining() {
          // eslint-disable-next-line @typescript-eslint/no-magic-numbers
          return Math.max(0, 50 - (Date.now() - start));
        },
      });
    }, 1);
  };

/** 格式化输出警告信息 */
export function logWarn(msg: unknown, appName?: string, ...rest: unknown[]): void {
  if (process.env.NODE_ENV === 'production') return;

  const prefix = appName && isString(appName) ? `[versea-app] ${appName}:` : '[versea]';
  if (isString(msg)) {
    console.warn(`${prefix} ${msg}`, ...rest);
  } else {
    console.warn(prefix, msg, ...rest);
  }
}

/** 格式化输出错误信息 */
export function logError(msg: unknown, appName?: string, ...rest: unknown[]): void {
  const prefix = appName && isString(appName) ? `[versea-app] ${appName}:` : '[versea]';
  if (isString(msg)) {
    console.error(`${prefix} ${msg}`, ...rest);
  } else {
    console.error(prefix, msg, ...rest);
  }
}
