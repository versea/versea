import 'reflect-metadata';
import { Container } from 'inversify';
import { Foo } from './common';

const container = new Container({
  defaultScope: 'Singleton',
});

container.bind('Foo').to(Foo).inSingletonScope();

console.log(container.get<Foo>('Foo').say());

export default container;

export function b(c: string, d: string): string {
  return c + d;
}
