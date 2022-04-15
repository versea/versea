import { AsyncParallelHook } from './async-parallel-hook';

async function delay(time: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, time * 100);
  });
}

/**
 * unit
 * @author huchao
 */
describe('AsyncSeriesHook', () => {
  test('添加监听函数之后执行 call，监听函数应该被正确调用。', async () => {
    const asyncParallelHook = new AsyncParallelHook();
    const fn1 = jest.fn();
    const fn2 = jest.fn();

    asyncParallelHook.tap(
      'test1',
      async () => {
        await delay(1);
        fn1();
      },
      {
        once: true,
      },
    );
    asyncParallelHook.tap('test2', async () => {
      await delay(1);
      fn2();
    });
    await asyncParallelHook.call({});
    await asyncParallelHook.call({});

    expect(fn1).toHaveBeenCalledTimes(1);
    expect(fn2).toHaveBeenCalledTimes(2);
  });
});
