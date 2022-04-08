import { AsyncSeriesHook } from '../src';

describe('AsyncSeriesHook', () => {
  it('创建', async () => {
    const mock1 = jest.fn();
    const mock2 = jest.fn();
    const hook = new AsyncSeriesHook();
    let i = 0;
    hook.tapAsync('a', (cb: () => void) => {
      i++;
      setTimeout(() => {
        expect(i).toBe(1);
        mock1();
        cb();
      }, 100);
    });

    hook.tap('a', () => {
      i++;
      expect(i).toBe(2);
      mock2();
    });
    await new Promise((resolve) => {
      hook.callAsync(() => {
        resolve(1);
      });
    });
    expect(mock1).toBeCalledTimes(1);
  });
});
