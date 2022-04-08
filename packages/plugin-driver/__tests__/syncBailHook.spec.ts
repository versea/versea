import { SyncBailHook } from '../src/sync';

// eslint-disable-next-line @typescript-eslint/ban-types
async function pify(fn: Function): Promise<unknown> {
  return new Promise((resolve, reject) => {
    fn((err, result: unknown) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

describe('SyncBailHook', () => {
  it('创建', async () => {
    const h0 = new SyncBailHook(['a']);
    const h1 = new SyncBailHook(['a', 'b']);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const r = h0.call(1);
    expect(r).toEqual(undefined);

    h0.tap('A', () => undefined);
    h1.tap('A', (a, b) => [a, b]);
    expect(h0.call(1)).toEqual(undefined);
    expect(await h0.promise(1)).toEqual(undefined);
    expect(
      await pify((cb) => {
        h0.callAsync(1, cb);
      }),
    ).toEqual(undefined);

    expect(h1.call(1, 2)).toEqual([1, 2]);
    expect(await h1.promise(1, 2)).toEqual([1, 2]);
    expect(
      await pify((cb) => {
        h1.callAsync(1, 2, cb);
      }),
    ).toEqual([1, 2]);

    h0.tap('B', (a) => `ok${a}`);
    h1.tap('B', () => 'not in');
    expect(h0.call(10)).toEqual('ok10');
    expect(await h0.promise(10)).toEqual('ok10');
    expect(
      await pify((cb) => {
        h0.callAsync(10, cb);
      }),
    ).toEqual('ok10');

    expect(h1.call(10, 20)).toEqual([10, 20]);
    expect(await h1.promise(10, 20)).toEqual([10, 20]);
    expect(
      await pify((cb) => {
        h1.callAsync(10, 20, cb);
      }),
    ).toEqual([10, 20]);
  });

  it('返回非undefined，停止后续执行', () => {
    const h0 = new SyncBailHook();
    const mock1 = jest.fn();
    const mock2 = jest.fn();
    const ret = 0;
    h0.tap('A', mock1);
    h0.tap('B', () => ret);
    h0.tap('C', mock2);
    expect(h0.call()).toEqual(ret);
    expect(mock1).toBeCalledTimes(1);
    expect(mock2).not.toBeCalled();
  });

  it('兼容多个插件注册', () => {
    const h0 = new SyncBailHook();
    const res = 42;
    for (let i = 0; i < 1000; i++) {
      h0.tap('A', () => res);
    }
    expect(h0.call()).toBe(res);
  });

  it('调用tapAsync/tapPromise抛出错误', () => {
    const hook = new SyncBailHook();
    expect(() => {
      hook.tapAsync();
    }).toThrow(/tapAsync/);
    expect(() => {
      hook.tapPromise();
    }).toThrow(/tapPromise/);
  });
});
