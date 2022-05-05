import { Container } from 'inversify';

import { createProvider } from './creator';
import { lazyInject } from './lazy-inject';

afterEach(() => {
  Reflect.defineMetadata('metaKey', [], Reflect);
  Reflect.defineMetadata('otherMetaKey', [], Reflect);
});

/**
 * unit
 * @author huchao
 */
describe('lazyInject', () => {
  test('使用 lazyInject 装饰依赖，应该可以成功注入。', () => {
    const { provide, buildProviderModule } = createProvider('metaKey');

    @provide('test')
    class Test {}

    @provide('test2')
    class Test2 {
      @lazyInject('test') public test!: Test;
    }

    const container = new Container({ defaultScope: 'Singleton' });
    container.load(buildProviderModule(container));
    expect(container.get('test2')).toBeInstanceOf(Test2);
    expect(container.get<Test2>('test2').test).toBeInstanceOf(Test);
  });

  test('使用 lazyInject 装饰依赖，并且两个依赖是循环依赖，应该可以成功注入。', () => {
    const { provide, buildProviderModule } = createProvider('metaKey');

    @provide('test')
    class Test {
      @lazyInject('test2') public test2!: object;
    }

    @provide('test2')
    class Test2 {
      @lazyInject('test') public test!: Test;
    }

    const container = new Container({ defaultScope: 'Singleton' });
    container.load(buildProviderModule(container));
    expect(container.get<Test>('test').test2).toBeInstanceOf(Test2);
    expect(container.get<Test2>('test2').test).toBeInstanceOf(Test);
  });
});
