import { Container } from 'inversify';

import { createProvider } from './creator';

afterEach(() => {
  Reflect.defineMetadata('metaKey', [], Reflect);
  Reflect.defineMetadata('otherMetaKey', [], Reflect);
});

/**
 * unit
 * @author huchao
 */
describe('createProvider', () => {
  test('创建一个使用 provide 装饰的类，应该自动绑定该类到容器。', () => {
    const { provide, buildProviderModule } = createProvider('metaKey');

    @provide('test')
    class Test {}

    const container = new Container({ defaultScope: 'Singleton' });
    container.load(buildProviderModule());
    expect(container.get('test')).toBeInstanceOf(Test);
  });

  test('同名继承使用 provide 装饰的类，绑定类型相同，应该自动绑定该继承的类到容器。', () => {
    const { provide, buildProviderModule } = createProvider('metaKey');

    @provide('test')
    class Test {}

    @provide('test')
    class OtherTest extends Test {}

    const container = new Container({ defaultScope: 'Singleton' });
    container.load(buildProviderModule());

    expect(container.get('test')).toBeInstanceOf(OtherTest);
  });

  test('同名不继承使用 provide 装饰的类，因为同名没有继承关系应该报错。', () => {
    const { provide } = createProvider('metaKey');

    @provide('test')
    class Test {}

    expect(() => {
      @provide('test')
      class OtherTest {}

      console.log(Test, OtherTest);
    }).toThrowError('Provide Error: replace serviceIdentifier');
  });

  test('同名继承使用 provide 装饰的类，绑定类型不同，应该报错。', () => {
    const { provide } = createProvider('metaKey');

    @provide('test')
    class Test {}

    expect(() => {
      @provide('test', 'Constructor')
      class OtherTest extends Test {}

      console.log(Test, OtherTest);
    }).toThrowError('Provide Error: replace serviceIdentifier');
  });

  test('两个不同的 provide 应该互不干扰。', () => {
    const { provide, buildProviderModule } = createProvider('metaKey');
    const { provide: otherProvide, buildProviderModule: otherBuildProviderModule } = createProvider('otherMetaKey');

    @provide('test')
    class Test {}

    @otherProvide('test')
    class OtherTest {}

    const container = new Container({ defaultScope: 'Singleton' });
    container.load(buildProviderModule());
    const otherContainer = new Container({ defaultScope: 'Singleton' });
    otherContainer.load(otherBuildProviderModule());

    expect(container.get('test')).toBeInstanceOf(Test);
    expect(otherContainer.get('test')).toBeInstanceOf(OtherTest);
  });

  test('调用 provideValue 绑定常量，应该自动绑定该常量到容器。', () => {
    const { provideValue, buildProviderModule } = createProvider('metaKey');

    provideValue('foo', 'test');
    const container = new Container({ defaultScope: 'Singleton' });
    container.load(buildProviderModule());

    expect(container.get('test')).toBe('foo');
  });

  test('两次调用 provideValue 绑定同名 key，应该绑定新值到容器。', () => {
    const { provideValue, buildProviderModule } = createProvider('metaKey');

    provideValue('foo', 'test');
    provideValue('bar', 'test');
    const container = new Container({ defaultScope: 'Singleton' });
    container.load(buildProviderModule());

    expect(container.get('test')).toBe('bar');
  });
});
