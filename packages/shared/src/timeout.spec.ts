import { VerseaTimeoutError } from './error';
import { createTimeoutDecorator, runWithTimeout, TimeoutOptions } from './timeout';

describe('Timeout', () => {
  describe('runWithTimeout', () => {
    it('should throw error after time out.', async () => {
      const promise = new Promise((resolve) => setTimeout(resolve, 100));

      await expect(runWithTimeout(promise, { millisecond: 0, dieOnTimeout: true })).rejects.toStrictEqual(
        new VerseaTimeoutError('The task has been timed out for 0ms.'),
      );
    });

    it('should be resolved within time out.', async () => {
      const promise = new Promise((resolve) =>
        setTimeout(() => {
          resolve('resolved');
        }, 10),
      );

      await expect(runWithTimeout(promise, { millisecond: 100 })).resolves.toBe('resolved');
    });

    it('should log warning and return resolved results instead of throwing error when dieOnTimeout is false.', async () => {
      const promise = new Promise((resolve) =>
        setTimeout(() => {
          resolve('resolved');
        }, 100),
      );

      jest.spyOn(console, 'warn');

      await expect(
        runWithTimeout(promise, {
          millisecond: 0,
          dieOnTimeout: false,
        }),
      ).resolves.toBe('resolved');

      expect(console.warn).toHaveBeenCalledWith('[versea] The task has been timed out for 0ms.');
    });

    it('should be able to get the error from the task within time out.', async () => {
      const promise = new Promise((_, reject) =>
        setTimeout(() => {
          reject(new Error('error from task.'));
        }, 10),
      );

      await expect(
        runWithTimeout(promise, {
          millisecond: 100,
          dieOnTimeout: false,
        }),
      ).rejects.toStrictEqual(new Error('error from task.'));
    });
  });

  describe('timeout decorator', () => {
    const timeout = createTimeoutDecorator((_, config?: TimeoutOptions) => config);

    it('should throw error after time out.', async () => {
      class Foo {
        @timeout({ millisecond: 10, dieOnTimeout: true, message: 'timeout.' })
        public async task(): Promise<number> {
          return new Promise((res) => setTimeout(res, 100));
        }
      }

      await expect(new Foo().task()).rejects.toStrictEqual(new VerseaTimeoutError('timeout.'));
    });

    it('should be resolved within time out.', async () => {
      class Foo {
        @timeout({ millisecond: 100 })
        public async task(): Promise<string> {
          return new Promise((resolve) =>
            setTimeout(() => {
              resolve('resolved');
            }, 10),
          );
        }
      }

      await expect(new Foo().task()).resolves.toBe('resolved');
    });

    it('should log warning and return resolved results instead of throwing error when dieOnTimeout is false.', async () => {
      class Foo {
        @timeout({ millisecond: 10, dieOnTimeout: false, message: 'timeout.' })
        public async task(): Promise<string> {
          return new Promise((resolve) =>
            setTimeout(() => {
              resolve('resolved');
            }, 100),
          );
        }
      }

      jest.spyOn(console, 'warn');

      await expect(new Foo().task()).resolves.toBe('resolved');

      expect(console.warn).toHaveBeenCalledWith('[versea] timeout.');
    });

    it('should be able to get the error from the task within time out.', async () => {
      class Foo {
        @timeout({ millisecond: 100, dieOnTimeout: false, message: 'timeout.' })
        public async task(): Promise<string> {
          return new Promise((_, reject) =>
            setTimeout(() => {
              reject(new Error('error from task.'));
            }, 10),
          );
        }
      }

      await expect(new Foo().task()).rejects.toStrictEqual(new Error('error from task.'));
    });
  });
});
