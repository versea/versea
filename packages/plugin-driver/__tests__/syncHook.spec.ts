import { SyncHook } from '../src/sync';

describe('SyncHook', () => {
  it('创建', async () => {
    const h0 = new SyncHook();

    h0.call();
    await h0.promise();
    await new Promise((resolve) => {
      h0.callAsync(resolve);
    });

    const mock0 = jest.fn();
    h0.tap('A', mock0);
    h0.call();
    expect(mock0).toHaveBeenCalledWith();

    const mock1 = jest.fn();
    h0.tap('B', mock1);
    h0.call();
    expect(mock1).toHaveBeenCalledWith();
  });

  it('带参调用', async () => {
    const h0 = new SyncHook(['test']);
    const h1 = new SyncHook(['arg1']);
    const h2 = new SyncHook(['arg1', 'arg2']);

    const mock0 = jest.fn();
    const mock1 = jest.fn();
    const mock2 = jest.fn();
    const mock3 = jest.fn();
    h0.tap('A', mock0);
    h1.tap('B', mock1);
    h2.tap('C', mock2);
    h2.tap('D', mock3);

    const h0Param = 1;
    const h1Param = '2';
    const arrParam = [new Set()];
    const objParam = { foo: 'bar' };
    const h2MultiParam = [arrParam, objParam];

    h0.call(h0Param);
    h1.call(h1Param);

    h2.call(...h2MultiParam);

    expect(mock0).toHaveBeenLastCalledWith(h0Param);
    expect(mock1).toHaveBeenLastCalledWith(h1Param);
    expect(mock2).toHaveBeenLastCalledWith(...h2MultiParam);
    expect(mock3).toHaveBeenLastCalledWith(...h2MultiParam);

    await new Promise((resolve) => {
      h0.callAsync(h0Param, resolve);
    });
    await h1.promise(h1Param);
    await new Promise((resolve) => {
      h2.callAsync(...h2MultiParam, resolve);
    });

    expect(mock0).toHaveBeenLastCalledWith(h0Param);
    expect(mock1).toHaveBeenLastCalledWith(h1Param);
    expect(mock2).toHaveBeenLastCalledWith(...h2MultiParam);
    expect(mock3).toHaveBeenLastCalledWith(...h2MultiParam);

    const singleParam = 'single';
    await h2.promise(singleParam);
    expect(mock2).toHaveBeenLastCalledWith(singleParam, undefined);
    expect(mock3).toHaveBeenLastCalledWith(singleParam, undefined);
  });

  it('同步执行', () => {
    const h0 = new SyncHook();
    const mock1 = jest.fn();
    const mock2 = jest.fn(() => 2);
    const mock3 = jest.fn(() => 3);
    h0.tap('A', mock1);
    h0.tap('B', mock2);
    h0.tap('C', mock3);
    expect(h0.call()).toEqual(undefined);
    expect(mock1).toHaveBeenCalledTimes(1);
    expect(mock2).toHaveBeenCalledTimes(1);
    expect(mock3).toHaveBeenCalledTimes(1);
  });

  it('调用tapAsync/tapPromise抛出错误', () => {
    const hook = new SyncHook();
    expect(() => {
      hook.tapAsync();
    }).toThrow(/tapAsync/);
    expect(() => {
      hook.tapPromise();
    }).toThrow(/tapPromise/);
  });
});
