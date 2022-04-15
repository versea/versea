import { AsyncSeriesHook } from './async-series-hook';

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
    const asyncSeriesHook = new AsyncSeriesHook();
    const fn = jest.fn();

    asyncSeriesHook.tap('test', async () => {
      await delay(1);
      fn();
    });
    await asyncSeriesHook.call({});

    expect(fn).toHaveBeenCalled();
  });

  test('添加监听函数并传入参数 once，多次调用 call，监听函数应该仅仅执行一次。', async () => {
    const asyncSeriesHook = new AsyncSeriesHook();
    const fn = jest.fn();

    asyncSeriesHook.tap(
      'test',
      async () => {
        await delay(1);
        fn();
      },
      { once: true },
    );
    await asyncSeriesHook.call({});
    await asyncSeriesHook.call({});

    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('添加多个监听函数之后执行 call，某个添加监听函数设置熔断应该能终止后续监听函数运行。', async () => {
    const asyncSeriesHook = new AsyncSeriesHook();
    const fn1 = jest.fn();
    const fn2 = jest.fn();

    asyncSeriesHook.tap('test1', async () => {
      await delay(1);
      fn1();
    });
    asyncSeriesHook.tap('bail', async (ctx) => {
      await delay(1);
      ctx.bail = true;
    });
    asyncSeriesHook.tap('test2', async () => {
      await delay(1);
      fn2();
    });
    await asyncSeriesHook.call({});

    expect(fn1).toHaveBeenCalled();
    expect(fn2).not.toHaveBeenCalled();
  });

  test('同一个的 HookContext，并嵌套的 hooks 调用关系，内层 hook 应该不会中断外层。', async () => {
    const asyncSeriesHook = new AsyncSeriesHook();
    const asyncSeriesHookInner = new AsyncSeriesHook();
    const fn1 = jest.fn();
    const fn2 = jest.fn();
    const fn3 = jest.fn();
    const fn4 = jest.fn();

    const context = {};
    asyncSeriesHook.tap('test1', async () => {
      await delay(1);
      fn1();
    });
    asyncSeriesHook.tap('inner', async () => {
      await asyncSeriesHookInner.call(context);
    });
    asyncSeriesHook.tap('test2', async () => {
      await delay(1);
      fn2();
    });
    asyncSeriesHookInner.tap('test3', async () => {
      await delay(1);
      fn3();
    });
    asyncSeriesHookInner.tap('bail', async (ctx) => {
      await delay(1);
      ctx.bail = true;
    });
    asyncSeriesHookInner.tap('test4', async () => {
      await delay(1);
      fn4();
    });
    await asyncSeriesHook.call(context);

    expect(fn1).toHaveBeenCalled();
    expect(fn2).toHaveBeenCalled();
    expect(fn3).toHaveBeenCalled();
    expect(fn4).not.toHaveBeenCalled();
  });

  test('添加多个监听函数之后执行 call，某个舰艇函数设置熔断之后报错，不会影响下一次 call 的运行。', async () => {
    const asyncSeriesHook = new AsyncSeriesHook();
    const fn1 = jest.fn();
    const fn2 = jest.fn();
    const fn3 = jest.fn();

    const context = {};
    asyncSeriesHook.tap(
      'test1',
      async () => {
        await delay(1);
        fn1();
      },
      { once: true },
    );
    asyncSeriesHook.tap('test2', async () => {
      await delay(1);
      fn2();
    });
    asyncSeriesHook.tap(
      'bail',
      (ctx) => {
        ctx.bail = true;
        throw new Error('test');
      },
      { once: true },
    );
    asyncSeriesHook.tap('test3', async () => {
      await delay(1);
      fn3();
    });

    try {
      await asyncSeriesHook.call(context);
      // eslint-disable-next-line no-empty
    } catch {}

    await asyncSeriesHook.call(context);

    expect(fn1).toHaveBeenCalledTimes(1);
    expect(fn2).toHaveBeenCalledTimes(2);
    expect(fn3).toHaveBeenCalledTimes(1);
  });
});
