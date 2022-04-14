import { clone } from 'ramda';

interface Tree {
  children?: Tree[];
}

export function createServiceSymbol(serviceIdentifier: string): symbol {
  return Symbol.for(serviceIdentifier);
}

/** 深度遍历树结构 */
export function traverse<T extends Tree>(node: T, callback: (node: T) => void): void {
  callback(node);
  if (node.children?.length) {
    node.children.forEach((n) => {
      traverse(n as T, callback);
    });
  }
}

export function cloneObjectWith<T extends object, K extends keyof T>(
  obj: T,
  handlers: Record<string, (value: unknown) => unknown> = {},
): T {
  const store: Record<string, unknown> = {};
  for (const key in obj) {
    const handler = handlers[key];
    // eslint-disable-next-line no-prototype-builtins
    if (obj.hasOwnProperty(key) && handler) {
      store[key] = obj[key];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
      obj[key] = undefined as any;
    }
  }
  const result = clone(obj);
  Object.keys(store).forEach((key) => {
    const handler = handlers[key];
    result[key as unknown as K] = handler(store[key]) as T[K];
  });
  return result;
}
