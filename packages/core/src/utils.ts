export function createServiceSymbol(serviceIdentifier: string): symbol {
  return Symbol.for(serviceIdentifier);
}
