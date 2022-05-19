export function isBoundFunction(target: unknown): boolean {
  // eslint-disable-next-line no-prototype-builtins
  return typeof target === 'function' && target.name.startsWith('bound ') && !target.hasOwnProperty('prototype');
}
