interface Tree {
  children?: Tree[];
}

export function createServiceSymbol(serviceIdentifier: string): symbol {
  return Symbol.for(serviceIdentifier);
}

export function traverse<T extends Tree>(node: T, callback: (node: T) => void): void {
  callback(node);
  if (node.children?.length) {
    node.children.forEach((n) => {
      traverse(n as T, callback);
    });
  }
}

export function guid(): string {
  const uidStr = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
  return uidStr.replace(/[xy]/g, (c) => {
    /* eslint-disable @typescript-eslint/no-magic-numbers */
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
