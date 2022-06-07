export function isPromise<T = unknown>(target: unknown): target is Promise<T> {
  return toString.call(target) === '[object Promise]';
}

export function isBoundFunction(target: unknown): boolean {
  // eslint-disable-next-line no-prototype-builtins
  return typeof target === 'function' && target.name.startsWith('bound ') && !target.hasOwnProperty('prototype');
}
