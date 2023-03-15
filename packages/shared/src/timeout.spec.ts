import { VerseaTimeoutError } from './error';
import { createTimeoutDecorator, promiseWithTimeout } from './timeout';

describe('Timeout', () => {
  describe('promiseWithTimeout', () => {
    it('should throw error after time out.', async () => {
      const promise = new Promise((res) => setTimeout(res, 2000));

      await expect(promiseWithTimeout(promise, { maxTime: 0, dieOnTimeout: true })).rejects.toStrictEqual(
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
          maxTime: 2000,
          dieOnTimeout: false,
        }),
      ).rejects.toStrictEqual(new Error('error from task.'));
    });
  });

  describe('timeout decorator', () => {
    const timeout = createTimeoutDecorator();

    it('should throw error after time out.', async () => {
      class Foo {
        @timeout({ maxTime: 0, dieOnTimeout: true, timeoutMsg: 'timeout.' })
        public async task(): Promise<number> {
          return new Promise((res) => setTimeout(res, 2000));
        }
      }

      await expect(new Foo().task()).rejects.toStrictEqual(new VerseaTimeoutError('timeout.'));
    });

    it('should be resolved within time out.', async () => {
      class Foo {
        @timeout({ maxTime: 2000 })
        public async task(): Promise<string> {
          return new Promise((res) =>
            setTimeout(() => {
              res('resolved');
            }, 0),
          );
        }
      }

      await expect(new Foo().task()).resolves.toBe('resolved');
    });

    it('should log warning and return resolved results instead of throwing error when dieOnTimeout is false.', async () => {
      class Foo {
        @timeout({ maxTime: 0, dieOnTimeout: false, timeoutMsg: 'timeout.' })
        public async task(): Promise<string> {
          return new Promise((res) =>
            setTimeout(() => {
              res('resolved');
            }, 500),
          );
        }
      }

      jest.spyOn(console, 'warn');

      await expect(new Foo().task()).resolves.toBe('resolved');

      expect(console.warn).toHaveBeenCalledWith('[versea] timeout.');
    });

    it('should be able to get the error from the task within time out.', async () => {
      class Foo {
        @timeout({ maxTime: 2000, dieOnTimeout: false, timeoutMsg: 'timeout.' })
        public async task(): Promise<string> {
          return new Promise((_, rej) =>
            setTimeout(() => {
              rej(new Error('error from task.'));
            }, 0),
          );
        }
      }

      await expect(new Foo().task()).rejects.toStrictEqual(new Error('error from task.'));
    });
  });
});
