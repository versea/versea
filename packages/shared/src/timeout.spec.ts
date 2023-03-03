import { runWithTimeout } from './timeout';

describe('Timeout', () => {
  it('should be reject after time out.', async () => {
    const task = async (): Promise<void> => new Promise((res) => setTimeout(res, 2000));

    await expect(runWithTimeout(task, { maxTime: 0 })).rejects.toBe('Task task has timed out for 0.');
  });

  it('should be resolved within time out.', async () => {
    const task = async (): Promise<string> =>
      new Promise((res) =>
        setTimeout(() => {
          res('resolved');
        }, 0),
      );

    await expect(runWithTimeout(task, { maxTime: 1000 })).resolves.toBe('resolved');
  });

  it('should be able to reject using timeoutCb option.', async () => {
    const task = async (): Promise<void> => new Promise((res) => setTimeout(res, 2000));

    await expect(
      runWithTimeout(task, {
        maxTime: 0,
        timeoutCb: (taskName, reject) => {
          reject(`${taskName} has been reject.`);
        },
      }),
    ).rejects.toBe('task has been reject.');
  });
});
