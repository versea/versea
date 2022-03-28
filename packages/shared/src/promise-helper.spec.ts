import { createPromiseMonitor } from './promise-helper';

async function delay(time: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, time * 100);
  });
}

/**
 * unit
 * @author huchao
 */
describe('memoizePromise', () => {
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
