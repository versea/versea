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

type FunctionalValue<T extends object> = {
  [key in keyof T]?: (value: T[key]) => T[key];
};

/**
 * ramda clone 方法增加自定义处理 key
 * @description ramda clone 无法跳过某些字段深拷贝，这里加上一个自定义处理
 */
export function cloneObjectWith<T extends object, K extends keyof T>(obj: T, handlers: FunctionalValue<T> = {}): T {
  const store: Pick<T, keyof FunctionalValue<T>> = {} as T;
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

  (Object.keys(store) as K[]).forEach((key) => {
    obj[key] = store[key];
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const handler = handlers[key]!;
    result[key] = handler(store[key]);
  });

  return result;
}
