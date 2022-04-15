import { SyncHook } from './sync-hook';

/**
 * unit
 * @author huchao
 */
describe('SyncHook', () => {
  test('添加监听函数之后执行 call，监听函数应该被正确调用。', () => {
    const syncHook = new SyncHook();
    const tapFn = jest.fn();

    syncHook.tap('test', tapFn);
    syncHook.call({});

    expect(tapFn).toHaveBeenCalled();
  });

  test('添加监听函数并传入参数 once，多次调用 call，监听函数应该仅仅执行一次。', () => {
    const syncHook = new SyncHook();
    const tapFn = jest.fn();

    syncHook.tap('test', tapFn, { once: true });
    syncHook.call({});
    syncHook.call({});

    expect(tapFn).toHaveBeenCalledTimes(1);
  });

  test('添加多个监听函数之后执行 call，某个添加监听函数设置熔断应该能终止后续监听函数运行。', () => {
    const syncHook = new SyncHook();
    const tapFn1 = jest.fn();
    const tapFn2 = jest.fn();

    syncHook.tap('test1', tapFn1);
    syncHook.tap('bail', (ctx) => (ctx.bail = true));
    syncHook.tap('test2', tapFn2);
    syncHook.call({});

    expect(tapFn1).toHaveBeenCalled();
    expect(tapFn2).not.toHaveBeenCalled();
  });

  test('同一个的 HookContext，并嵌套的 hooks 调用关系，内层 hook 应该不会中断外层。', () => {
    const syncHook = new SyncHook();
    const syncHookInner = new SyncHook();
    const tapFn1 = jest.fn();
    const tapFn2 = jest.fn();
    const tapFn3 = jest.fn();
    const tapFn4 = jest.fn();

    const context = {};
    syncHook.tap('test1', tapFn1);
    syncHook.tap('inner', () => {
      syncHookInner.call(context);
    });
    syncHook.tap('test2', tapFn2);
    syncHookInner.tap('test3', tapFn3);
    syncHookInner.tap('bail', (ctx) => (ctx.bail = true));
    syncHookInner.tap('test4', tapFn4);
    syncHook.call(context);

    expect(tapFn1).toHaveBeenCalled();
    expect(tapFn2).toHaveBeenCalled();
    expect(tapFn3).toHaveBeenCalled();
    expect(tapFn4).not.toHaveBeenCalled();
  });

  test('添加多个监听函数之后执行 call，某个舰艇函数设置熔断之后报错，不会影响下一次 call 的运行。', () => {
    const syncHook = new SyncHook();
    const tapFn1 = jest.fn();
    const tapFn2 = jest.fn();
    const tapFn3 = jest.fn();

    const context = {};
    syncHook.tap('test1', tapFn1, { once: true });
    syncHook.tap('test2', tapFn2);
    syncHook.tap(
      'bail',
      (ctx) => {
        ctx.bail = true;
        throw new Error('test');
      },
      { once: true },
    );
    syncHook.tap('test3', tapFn3);

    try {
      syncHook.call(context);
      // eslint-disable-next-line no-empty
    } catch {}

    syncHook.call(context);

    expect(tapFn1).toHaveBeenCalledTimes(1);
    expect(tapFn2).toHaveBeenCalledTimes(2);
    expect(tapFn3).toHaveBeenCalledTimes(1);
  });
});
