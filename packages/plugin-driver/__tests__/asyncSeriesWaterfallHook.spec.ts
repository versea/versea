import { AsyncSeriesWaterfallHook } from '../src';

describe('AsyncSeriesWaterfallHook', () => {
  it('使用', async () => {
    const hook = new AsyncSeriesWaterfallHook(['x']);
    hook.tapAsync('a', (x, cb: (param: number) => void) => {
      expect(x).toBe(1);
      cb(2);
    });
    hook.tap('a', (x) => {
      expect(x).toBe(2);
    });
    await new Promise((resolve) => {
      hook.callAsync(1, () => {
        resolve(1);
      });
    });
  });
});
