import { Container } from 'inversify';

import { StatusEnum } from '../../constants/status';
import { buildProviderModule } from '../../provider';
import { AppHooks, AppOptions, IApp } from '../app/service';
import { IAppController, IAppControllerKey } from './service';

async function delay(time: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, time * 100);
  });
}

function getAppInstance(options: AppOptions): IApp {
  const container = new Container({ defaultScope: 'Singleton' });
  container.load(buildProviderModule());
  const appController = container.get<IAppController>(IAppControllerKey);
  return appController.registerApp(options);
}

function getAppWithLoadOptions(options: AppOptions, hooks: AppHooks = {}): IApp {
  return getAppInstance({
    loadApp: async () => {
      return Promise.resolve({
        bootstrap: async () => {
          await delay(1);
          return;
        },
        mount: async () => {
          await delay(1);
          return;
        },
        unmount: async () => {
          await delay(1);
          return;
        },
        ...hooks,
      });
    },
    ...options,
  });
}

/**
 * unit
 * @author huchao
 */
describe('App', () => {
  describe('App.load', () => {
    test('load 应用之前和之后，应用的状态变化应该正确', async () => {
      const app = getAppInstance({
        name: 'app',
        loadApp: async () => {
          await delay(1);
          return Promise.resolve({});
        },
      });

      expect(app.status).toBe(StatusEnum.NotLoaded);
      const promise = app.load({});
      expect(app.status).toBe(StatusEnum.LoadingSourceCode);
      await promise;
      expect(app.status).toBe(StatusEnum.NotBootstrapped);
    });

    test('实例化时没有 loadApp 参数，加载应用时会报错', () => {
      const app = getAppInstance({ name: 'app' });

      expect(app.status).toBe(StatusEnum.NotLoaded);
      void expect(async () => {
        await app.load({});
      }).rejects.toThrowError('Can not find loadApp prop');
      expect(app.status).toBe(StatusEnum.SkipBecauseBroken);
    });

    test('load 应用失败，应用的状态变化为 LoadError', async () => {
      const app = getAppInstance({
        name: 'app',
        loadApp: async () => {
          await delay(1);
          throw new Error('load error');
        },
      });

      try {
        await app.load({});
      } catch (error) {
        expect(app.status).toBe(StatusEnum.LoadError);
      }
    });
  });

  describe('App.bootstrap', () => {
    test('bootstrap 应用之前和之后，应用的状态变化应该正确', async () => {
      const app = getAppWithLoadOptions({ name: 'app' });
      await app.load({});

      expect(app.status).toBe(StatusEnum.NotBootstrapped);
      const promise = app.bootstrap({});
      expect(app.status).toBe(StatusEnum.Bootstrapping);
      await promise;
      expect(app.status).toBe(StatusEnum.NotMounted);
    });

    test('没有 bootstrap 的 hook，应用的状态变化应该正确', async () => {
      const app = getAppWithLoadOptions({ name: 'app' }, { bootstrap: undefined });
      await app.load({});

      expect(app.status).toBe(StatusEnum.NotBootstrapped);
      await app.bootstrap({});
      expect(app.status).toBe(StatusEnum.NotMounted);
    });

    test('bootstrap 应用失败，应用的状态变化为 broken', async () => {
      const app = getAppWithLoadOptions(
        { name: 'app' },
        {
          bootstrap: async () => {
            await delay(1);
            throw new Error('bootstrap error');
          },
        },
      );
      await app.load({});

      try {
        await app.bootstrap({});
      } catch (error) {
        expect(app.status).toBe(StatusEnum.SkipBecauseBroken);
      }
    });
  });

  describe('App.mount', () => {
    test('mount 应用之前和之后，应用的状态变化应该正确', async () => {
      const app = getAppWithLoadOptions({ name: 'app' });
      await app.load({});
      await app.bootstrap({});

      expect(app.status).toBe(StatusEnum.NotMounted);
      const promise = app.mount({});
      expect(app.status).toBe(StatusEnum.Mounting);
      await promise;
      expect(app.status).toBe(StatusEnum.Mounted);
    });

    test('没有 mount 的 hook，应用的状态变化应该正确', async () => {
      const app = getAppWithLoadOptions({ name: 'app' }, { mount: undefined });
      await app.load({});
      await app.bootstrap({});

      expect(app.status).toBe(StatusEnum.NotMounted);
      await app.mount({});
      expect(app.status).toBe(StatusEnum.Mounted);
    });

    test('mount 应用失败，应用的状态变化为 broken', async () => {
      const app = getAppWithLoadOptions(
        { name: 'app' },
        {
          mount: async () => {
            await delay(1);
            throw new Error('mount error');
          },
        },
      );
      await app.load({});
      await app.bootstrap({});

      try {
        await app.mount({});
      } catch (error) {
        expect(app.status).toBe(StatusEnum.SkipBecauseBroken);
      }
    });
  });

  describe('App.unmount', () => {
    test('unmount 应用之前和之后，应用的状态变化应该正确', async () => {
      const app = getAppWithLoadOptions({ name: 'app' });
      await app.load({});
      await app.bootstrap({});
      await app.mount({});

      expect(app.status).toBe(StatusEnum.Mounted);
      const promise = app.unmount({});
      expect(app.status).toBe(StatusEnum.Unmounting);
      await promise;
      expect(app.status).toBe(StatusEnum.NotMounted);
    });

    test('没有 unmount 的 hook，应用的状态变化应该正确', async () => {
      const app = getAppWithLoadOptions({ name: 'app' }, { unmount: undefined });
      await app.load({});
      await app.bootstrap({});
      await app.mount({});

      expect(app.status).toBe(StatusEnum.Mounted);
      await app.unmount({});
      expect(app.status).toBe(StatusEnum.NotMounted);
    });

    test('unmount 应用失败，应用的状态变化为 broken', async () => {
      const app = getAppWithLoadOptions(
        { name: 'app' },
        {
          unmount: async () => {
            await delay(1);
            throw new Error('unmount error');
          },
        },
      );
      await app.load({});
      await app.bootstrap({});
      await app.mount({});

      try {
        await app.unmount({});
      } catch (error) {
        expect(app.status).toBe(StatusEnum.SkipBecauseBroken);
      }
    });
  });
});
