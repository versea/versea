import { injectable } from 'inversify';

@injectable()
export class Foo {
  public say(): string {
    return 'hello world';
  }
}
