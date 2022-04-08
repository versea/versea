import { AsyncSeriesBailHook } from '../src';

describe('AsyncSeriesBailHook', () => {
  it('使用', async () => {
    const mock1 = jest.fn();
    const mock2 = jest.fn();
    const hook = new AsyncSeriesBailHook();
    hook.tap('a', () => {
      mock1();
      return true;
    });

    hook.tapAsync('a', (cb: () => void) => {
      mock2();
      setTimeout(cb, 100);
    });

    await new Promise<void>((resolve) => {
      hook.callAsync(() => {
        resolve();
      });
    });

    expect(mock1).toBeCalledTimes(1);
    expect(mock2).toBeCalledTimes(0);
    await hook.promise();

    expect(mock1).toBeCalledTimes(2);
    expect(mock2).toBeCalledTimes(0);
  });

  it('没有tap，得到传入参数', async () => {
    const hook = new AsyncSeriesBailHook(['a']);
    await hook
      .promise(123)
      .then((res) => {
        expect(res).toBe(123);
      })
      .catch(console.log);
  });
});
