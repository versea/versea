/** 获取当前环境是否支持 module script */
export function isSupportModuleScript(): boolean {
  const s = document.createElement('script');
  return 'noModule' in s;
}

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
    const pathArray = fullPath.split('/');
    pathArray.pop();
    return pathArray.join('/') + '/';
  }

  return `${origin}${pathname}/`.replace(/\/\/$/, '/');
}

/** 完善路径 */
export function completionPath(path: string, baseURL?: string): string {
  if (!path || !baseURL || /^((((ht|f)tps?)|file):)?\/\//.test(path) || /^(data|blob):/.test(path)) {
    return path;
  }

  return new URL(path, baseURL).toString();
}
