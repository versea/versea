import { VerseaTimeoutError } from './error';
import { promiseWithTimeout } from './timeout';

describe('Timeout', () => {
  it('should throw error after time out.', async () => {
    const promise = new Promise((res) => setTimeout(res, 2000));

    await expect(promiseWithTimeout(promise, { maxTime: 0 })).rejects.toStrictEqual(
      new VerseaTimeoutError('Task has been timed out for 0.'),
    );
  });

  it('should be resolved within time out.', async () => {
    const promise = new Promise((res) =>
      setTimeout(() => {
        res('resolved');
      }, 0),
    );

    await expect(promiseWithTimeout(promise, { maxTime: 1000 })).resolves.toBe('resolved');
  });

  it('should log warning and return resolved results instead of throwing error when dieOnTimeout is false.', async () => {
    const promise = new Promise((res) =>
      setTimeout(() => {
        res('resolved');
      }, 500),
    );

    jest.spyOn(console, 'warn');

    await expect(
      promiseWithTimeout(promise, {
        maxTime: 0,
        dieOnTimeout: false,
      }),
    ).resolves.toBe('resolved');

    expect(console.warn).toHaveBeenCalledWith('[versea] Task has been timed out for 0.');
  });

  it('should be able to get the error from the task within time out.', async () => {
    const promise = new Promise((_, rej) =>
      setTimeout(() => {
        rej(new Error('error from task.'));
      }, 0),
    );

    await expect(
      promiseWithTimeout(promise, {
        maxTime: 0,
        dieOnTimeout: false,
      }),
    ).rejects.toStrictEqual(new Error('error from task.'));
  });
});
