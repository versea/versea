import { Container } from 'inversify';

import { createProvider } from './creator';

/**
 * unit
 * @author huchao
 */
describe('createProvider', () => {
  afterEach(() => {
    Reflect.defineMetadata('metaKey', [], Reflect);
    Reflect.defineMetadata('otherMetaKey', [], Reflect);
  });

  test('新建一个类，使用 provide 装饰，应当自动绑定成功。', () => {
    const { provide, buildProviderModule } = createProvider('metaKey');

    @provide('test')
    class Test {}

    const container = new Container();
    container.load(buildProviderModule());
    expect(container.get('test')).toBeInstanceOf(Test);
  });

  test('新建一个类，使用 provide 装饰，然后继承该类，也使用 provide 装饰并使用相同的 key，应当自动绑定继承的类。', () => {
    const { provide, buildProviderModule } = createProvider('metaKey');

    @provide('test')
    class Test {}

    @provide('test')
    class OtherTest extends Test {}

    const container = new Container();
    container.load(buildProviderModule());
    expect(container.get('test')).toBeInstanceOf(OtherTest);
  });

  test('创建两个不同的 provide，绑定相同的 provide key，应该互不干扰。', () => {
    const { provide, buildProviderModule } = createProvider('metaKey');
    const { provide: otherProvide, buildProviderModule: otherBuildProviderModule } = createProvider('otherMetaKey');

    @provide('test')
    class Test {}

    @otherProvide('test')
    class OtherTest {}

    const container = new Container();
    container.load(buildProviderModule());
    const otherContainer = new Container();
    otherContainer.load(otherBuildProviderModule());

    expect(container.get('test')).toBeInstanceOf(Test);
    expect(otherContainer.get('test')).toBeInstanceOf(OtherTest);
  });
});
