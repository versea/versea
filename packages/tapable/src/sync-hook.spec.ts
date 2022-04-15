import { SyncHook } from './sync-hook';

/**
 * unit
 * @author huchao
 */
describe('SyncHook', () => {
  test('Tap 之后执行 call，Tap 的函数应该被调用。', () => {
    const hook = new SyncHook();
    const tapFn = jest.fn();

    hook.tap('test', tapFn);
    hook.call({});

    expect(tapFn).toHaveBeenCalled();
  });

  test('Tap 添加参数 once 之后，多次调用call，Tap 应该仅仅执行一次。', () => {
    const syncHook = new SyncHook();
    const tapFn = jest.fn();

    syncHook.tap('test', tapFn, { once: true });
    syncHook.call({});
    syncHook.call({});

    expect(tapFn).toHaveBeenCalledTimes(1);
  });
});
