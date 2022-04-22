/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { BaseHook } from './base-hook';

/**
 * unit
 * @author huchao
 */
describe('BaseHook', () => {
  test('添加监听函数之后，监听函数应该被存到 BaseHook 里面。', () => {
    const baseHook = new BaseHook();
    const tapFn = jest.fn();

    baseHook.tap('test', tapFn);

    expect((baseHook as any)._taps[0].fn).toBe(tapFn);
  });

  test('添加监听函数之后，应该可以使用 remove 删除监听函数。', () => {
    const baseHook = new BaseHook();
    const tapFn = jest.fn();

    baseHook.tap('test', tapFn);
    baseHook.remove('test');

    expect((baseHook as any)._taps).toStrictEqual([]);
  });

  test('添加多个优先级不同的监听函数，应该可以正确排序。', () => {
    const baseHook = new BaseHook();
    const tapFn1 = jest.fn();
    baseHook.tap('test1', tapFn1);
    const tapFn2 = jest.fn();
    baseHook.tap('test2', tapFn2, { priority: -1 });
    const tapFn3 = jest.fn();
    baseHook.tap('test3', tapFn3, { priority: -2 });

    expect((baseHook as any)._taps).toMatchObject([
      {
        fn: tapFn3,
      },
      {
        fn: tapFn2,
      },
      {
        fn: tapFn1,
      },
    ]);
  });

  test('使用 before 设置监听函数顺序，应该可以正确排序。', () => {
    const baseHook = new BaseHook();
    const tapFn1 = jest.fn();
    baseHook.tap('test1', tapFn1);
    const tapFn2 = jest.fn();
    baseHook.tap('test2', tapFn2, { before: 'test1' });
    const tapFn3 = jest.fn();
    baseHook.tap('test3', tapFn3, { before: 'test1' });

    expect((baseHook as any)._taps).toMatchObject([
      {
        fn: tapFn2,
      },
      {
        fn: tapFn3,
      },
      {
        fn: tapFn1,
      },
    ]);
  });

  test('使用 before 设置不存在的监听名称，应该会报错。', () => {
    const baseHook = new BaseHook();
    const tapFn1 = jest.fn();
    baseHook.tap('test1', tapFn1);
    const tapFn2 = jest.fn();
    expect(() => {
      baseHook.tap('test2', tapFn2, { before: 'test3' });
    }).toThrowError();
  });

  test('使用 after 设置监听函数顺序，应该可以正确排序。', () => {
    const baseHook = new BaseHook();
    const tapFn1 = jest.fn();
    baseHook.tap('test1', tapFn1);
    const tapFn2 = jest.fn();
    baseHook.tap('test2', tapFn2, { after: 'test1' });
    const tapFn3 = jest.fn();
    baseHook.tap('test3', tapFn3, { after: 'test1' });

    expect((baseHook as any)._taps).toMatchObject([
      {
        fn: tapFn1,
      },
      {
        fn: tapFn3,
      },
      {
        fn: tapFn2,
      },
    ]);
  });

  test('添加两个相同名称的监听函数，并且声明替换，应该可以被正确替换。', () => {
    const baseHook = new BaseHook();
    const tapFn1 = jest.fn();
    baseHook.tap('test1', tapFn1);
    const tapFn2 = jest.fn();
    baseHook.tap('test1', tapFn2, { replace: true });

    expect((baseHook as any)._taps).toMatchObject([
      {
        fn: tapFn2,
      },
    ]);
  });

  test('添加两个相同名称的监听函数，不声明替换，应该会报错。', () => {
    const baseHook = new BaseHook();
    const tapFn1 = jest.fn();
    baseHook.tap('test1', tapFn1);
    const tapFn2 = jest.fn();

    expect(() => {
      baseHook.tap('test1', tapFn2);
    }).toThrowError();
  });
});
