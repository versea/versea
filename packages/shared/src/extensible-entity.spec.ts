/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { ExtensibleEntity } from './extensible-entity';

/**
 * unit
 * @author huchao
 */
describe('ExtensibleEntity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  test('新建一个类，继承 ExtensibleEntity，使用 defineProp，实例化的这个类应该可以自动增加这个属性', () => {
    class Test extends ExtensibleEntity {}
    Test.defineProp('key', { default: 1 });

    const test = new Test();
    expect(test).toEqual({ key: 1 });
  });

  test('新建一个类，继承 ExtensibleEntity，使用 defineProp 两次使用相同的 key，应该会报错', () => {
    class Test extends ExtensibleEntity {}
    Test.defineProp('key', { default: 1 });

    expect(() => {
      Test.defineProp('key', { default: 2 });
    }).toThrowError('Duplicate prop');
  });

  test('新建一个类 A 继承于 ExtensibleEntity，使用 defineProp，新建一个类 B 继承于 A，使用 defineProp，A 的实例应该仅仅包含 A defineProp 的属性', () => {
    class A extends ExtensibleEntity {}
    A.defineProp('keyA', { default: 1 });

    class B extends A {}
    B.defineProp('keyB', { default: 2 });

    const a = new A();
    expect(a).toEqual({ keyA: 1 });
  });

  test('新建一个类 A 继承于 ExtensibleEntity，使用 defineProp，新建一个类 B 继承于 A，使用 defineProp，B 的实例应该同时包含 A defineProp 的属性和 B defineProp 的属性', () => {
    class A extends ExtensibleEntity {}
    A.defineProp('keyA', { default: 1 });

    class B extends A {}
    B.defineProp('keyB', { default: 2 });

    const b = new B();
    expect(b).toEqual({ keyA: 1, keyB: 2 });
  });

  test('新建一个类 A 继承于 ExtensibleEntity，使用 defineProp，新建一个类 B 继承于 A，使用 defineProp，新建一个类 C 继承于 A，使用 defineProp，ABC 三个类应该互不干扰', () => {
    class A extends ExtensibleEntity {}
    A.defineProp('keyA', { default: 1 });

    class B extends A {}
    B.defineProp('keyB', { default: 2 });

    class C extends A {}
    C.defineProp('keyC', { default: 3 });

    const b = new B();
    expect(b).toEqual({ keyA: 1, keyB: 2 });

    const c = new C();
    expect(c).toEqual({ keyA: 1, keyC: 3 });
  });

  test('新建一个类 A 继承于 ExtensibleEntity，使用 defineProp 传入 default 是一个对象，应该有一条警告', () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

    class A extends ExtensibleEntity {}
    A.defineProp('keyA', { default: {} });
    new A();

    expect(consoleWarnSpy).toHaveBeenCalled();
  });

  test('新建一个类 A 继承于 ExtensibleEntity，使用 defineProp 传入 required，不传这个参数应该报错', () => {
    class A extends ExtensibleEntity {}
    A.defineProp('keyA', { required: true });

    expect(() => new A()).toThrowError('Missing required prop');
  });

  test('新建一个类 A 继承于 ExtensibleEntity，使用 defineProp 传入 required，传入这个参数应该没有报错', () => {
    class A extends ExtensibleEntity {}
    A.defineProp('keyA', { required: true });

    expect(() => new A({ keyA: 1 })).not.toThrowError('Missing required prop');
  });

  test('新建一个类 A 继承于 ExtensibleEntity，使用 defineProp 传入 validator，验证参数不正确应该报错', () => {
    class A extends ExtensibleEntity {}
    A.defineProp('keyA', { validator: (value) => typeof value === 'number' });

    expect(() => new A({ keyA: '1' })).toThrowError('custom validator check failed');
  });

  test('新建一个类 A 继承于 ExtensibleEntity，使用 defineProp 传入 validator，验证参数正确应该不报错', () => {
    class A extends ExtensibleEntity {}
    A.defineProp('keyA', { validator: (value) => typeof value === 'number' });

    expect(() => new A({ keyA: 1 })).not.toThrowError('custom validator check failed');
  });
});
