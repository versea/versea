import { SyncWaterfallHook } from '../src/sync';

// eslint-disable-next-line @typescript-eslint/ban-types
async function pify(fn: Function): Promise<unknown> {
  return new Promise((resolve, reject) => {
    fn((err, result: unknown) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

describe('SyncWaterfallHook', () => {
  it('执行参数', () => {
    const mock0 = jest.fn();
    const mock1 = jest.fn();
    const hook = new SyncWaterfallHook(['arg1', 'arg2']);
    hook.tap('A', mock0);
    hook.tap('A', mock1);
    hook.call(1, 2);
    expect(mock0).toBeCalledWith(1, 2);
  });

  it('创建同步hook', async () => {
    const hook = new SyncWaterfallHook(['arg1', 'arg2']);
    const mock0 = jest.fn((arg: string) => `${arg},0`);
    const mock1 = jest.fn((arg: string) => `${arg},1`);
    const mock2 = jest.fn((arg: string) => `${arg},2`);

    hook.tap('A', mock0);
    hook.tap('B', mock1);
    hook.tap('C', mock2);

    const returnValue0 = hook.call('sync', 'a2') as string;
    expect(returnValue0).toBe('sync,0,1,2');
    expect(mock0).toHaveBeenLastCalledWith('sync', 'a2');
    expect(mock1).toHaveBeenLastCalledWith('sync,0', 'a2');
    expect(mock2).toHaveBeenLastCalledWith('sync,0,1', 'a2');

    const returnValue1 = await new Promise((resolve) => {
      hook.callAsync('async', 'a2', (...args: unknown[]) => {
        resolve(args);
      });
    });

    expect(returnValue1).toEqual([null, 'async,0,1,2']);
    expect(mock0).toHaveBeenCalledWith('async', 'a2');
    expect(mock1).toHaveBeenCalledWith('async,0', 'a2');
    expect(mock2).toHaveBeenCalledWith('async,0,1', 'a2');

    const returnValue2 = (await hook.promise('promise', 'a2')) as string;

    expect(returnValue2).toBe('promise,0,1,2');
    expect(mock0).toHaveBeenLastCalledWith('promise', 'a2');
    expect(mock1).toHaveBeenLastCalledWith('promise,0', 'a2');
    expect(mock2).toHaveBeenLastCalledWith('promise,0,1', 'a2');
  });

  it('创建waterfall钩子', async () => {
    const h1 = new SyncWaterfallHook(['a']);
    const h2 = new SyncWaterfallHook(['a', 'b']);

    expect(h1.call(1)).toEqual(1);

    h1.tap('A', () => undefined);
    h2.tap('A', (a, b) => [a, b]);

    expect(h1.call(1)).toEqual(1);
    expect(await h1.promise(1)).toEqual(1);
    expect(
      await pify((cb: unknown) => {
        h1.callAsync(1, cb);
      }),
    ).toEqual(1);
    expect(h2.call(1, 2)).toEqual([1, 2]);
    expect(await h2.promise(1, 2)).toEqual([1, 2]);
    expect(
      await pify((cb: unknown) => {
        h2.callAsync(1, 2, cb);
      }),
    ).toEqual([1, 2]);

    let count = 1;
    count = h1.call(count + ++count) as number;
    count = h1.call(count + ++count) as number;
    count = h1.call(count + ++count) as number;
    expect(count).toEqual(15);
  });

  it('调用tapAsync/tapPromise抛出错误', () => {
    const hook = new SyncWaterfallHook();
    expect(() => {
      hook.tapAsync();
    }).toThrow(/tapAsync/);
    expect(() => {
      hook.tapPromise();
    }).toThrow(/tapPromise/);
  });
});
