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

export function getQuery(): Record<string, string> {
  const url: string = window.location.search; //获取url中"?"符后的字串
  const theRequest: Record<string, string> = {};
  if (url.includes('?')) {
    const str: string = url.substring(1);
    const strAry: string[] = str.split('&');
    for (const i of strAry) {
      const splitAry: string[] = i.split('=');
      theRequest[splitAry[0]] = splitAry[1];
    }
  }
  return theRequest;
}
