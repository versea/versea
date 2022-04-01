import { createPromiseMonitor, memoizePromise } from './promise-helper';

async function delay(time: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, time * 100);
  });
}

/**
 * unit
 * @author huchao
 */
describe('createPromiseMonitor', () => {
  test('新建一个 PromiseMonitor, 调用 monitor.resolve，monitor.promise 应该能被正常 resolve 并 返回正确的值', async () => {
    const test = 'test';
    const monitor = createPromiseMonitor<string>();

    await delay(1);
    monitor.resolve(test);

    await expect(monitor.promise).resolves.toBe(test);
  });

  test('新建一个 PromiseMonitor, 调用 monitor.reject，monitor.promise 应该能被 reject', async () => {
    const testError = new Error('test');
    const monitor = createPromiseMonitor<string>();

    await delay(1);
    monitor.reject(testError);

    await expect(monitor.promise).rejects.toBe(testError);
  });
});

/**
 * unit
 * @author huchao
 */
describe('memoizePromise', () => {
  test('新建一个类，其中异步函数使用 memoizePromise 装饰，在 promise settled 之前调用，内部逻辑应该只会调用一次', async () => {
    class Test {
      @memoizePromise()
      public async func(): Promise<void> {
        this.func2();
        return delay(1);
      }

      public func2(): number {
        return 0;
      }
    }

    const spy = jest.spyOn(Test.prototype, 'func2');
    const test = new Test();
    void test.func();
    await delay(0.5);
    void test.func();
    await delay(1);

    expect(spy).toHaveBeenCalledTimes(1);
  });

  test('新建一个类，其中异步函数使用 memoizePromise 装饰，在 promise settled 之前调用，但使用不同的参数，内部逻辑应该只会调用多次', async () => {
    class Test {
      @memoizePromise()
      public async func(a: number): Promise<void> {
        this.func2(a);
        return delay(1);
      }

      public func2(a: number): number {
        return a;
      }
    }

    const spy = jest.spyOn(Test.prototype, 'func2');
    const test = new Test();
    void test.func(1);
    await delay(0.5);
    void test.func(2);
    await delay(1);

    expect(spy).toHaveBeenCalledTimes(2);
  });

  test('新建一个类，其中异步函数使用 memoizePromise 装饰，在 promise settled 之后调用，内部逻辑应该会调用多次', async () => {
    class Test {
      @memoizePromise()
      public async func(): Promise<void> {
        this.func2();
        return delay(1);
      }

      public func2(): number {
        return 0;
      }
    }

    const spy = jest.spyOn(Test.prototype, 'func2');
    const test = new Test();
    void test.func();
    await delay(1.5);
    void test.func();

    expect(spy).toHaveBeenCalledTimes(2);
  });

  test('新建一个类，其中异步函数使用 memoizePromise 装饰，装饰后的函数，应该可以返回相同的值', async () => {
    const returnValue = {};

    class Test {
      @memoizePromise()
      public async func(): Promise<Record<string, string>> {
        await delay(1);
        return this.func2();
      }

      public func2(): Record<string, string> {
        return returnValue;
      }
    }

    const test = new Test();
    const promise1 = test.func();
    await delay(0.5);
    const promise2 = test.func();
    const value1 = await promise1;
    const value2 = await promise2;

    expect(value1).toBe(returnValue);
    expect(value2).toBe(returnValue);
  });
});
