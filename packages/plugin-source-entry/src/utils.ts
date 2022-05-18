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

/** 增加链接协议 */
export function addProtocol(url?: string): string {
  if (!url) return '';

  return url.startsWith('//') ? `${location.protocol}${url}` : url;
}

/** 获取有效的公共路径 */
export function getEffectivePath(url?: string): string {
  if (!url) return '';

  const { origin, pathname } = new URL(url);
  if (/\.(\w+)$/.test(pathname)) {
    const fullPath = `${origin}${pathname}`;
    const pathArr = fullPath.split('/');
    pathArr.pop();
    return pathArr.join('/') + '/';
  }

  return `${origin}${pathname}/`.replace(/\/\/$/, '/');
}

/** 完善路径 */
export function completionPath(path: string, baseURL?: string): string {
  if (!path || !baseURL || /^((((ht|f)tps?)|file):)?\/\//.test(path) || /^(data|blob):/.test(path)) return path;
  return new URL(path, baseURL).toString();
}
