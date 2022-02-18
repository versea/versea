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
