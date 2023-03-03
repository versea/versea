import { promiseWithTimeout } from './timeout';

describe('Timeout', () => {
  it('should be reject after time out.', async () => {
    const promise = new Promise((res) => setTimeout(res, 2000));

    await expect(promiseWithTimeout(promise, { maxTime: 0 })).rejects.toBe('Task has been timed out for 0.');
  });

  it('should be resolved within time out.', async () => {
    const promise = new Promise((res) =>
      setTimeout(() => {
        res('resolved');
      }, 0),
    );

    await expect(promiseWithTimeout(promise, { maxTime: 1000 })).resolves.toBe('resolved');
  });

  it('should be able to reject using timeoutCb option.', async () => {
    const promise = new Promise((res) => setTimeout(res, 2000));

    await expect(
      promiseWithTimeout(promise, {
        maxTime: 0,
        timeoutCb: (reject) => {
          reject('rejected');
        },
      }),
    ).rejects.toBe('rejected');
  });
});
