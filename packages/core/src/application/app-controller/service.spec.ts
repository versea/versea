import { Container } from 'inversify';

import { IAppSwitcherContext } from '../../app-switcher/app-switcher-context/service';
import { StatusEnum } from '../../constants/status';
import { buildProviderModule } from '../../provider';
import { AppHooks, AppOptions, IApp, HookFunction } from '../app/service';
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

function getAppWithLoadOptions(
  options: AppOptions,
  hooks: AppHooks = {},
  mountHooks?: Record<string, HookFunction>,
): IApp {
  return getAppInstance({
    loadApp: async () => {
      return Promise.resolve({
        bootstrap: async () => {
          await delay(1);
          return;
        },
        mount: async () => {
          await delay(1);
          return mountHooks;
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
      const promise = app.load({} as IAppSwitcherContext);
      expect(app.status).toBe(StatusEnum.LoadingSourceCode);
      await promise;
      expect(app.status).toBe(StatusEnum.NotBootstrapped);
    });

    test('实例化时没有 loadApp 参数，加载应用时会报错', () => {
      const app = getAppInstance({ name: 'app' });

      expect(app.status).toBe(StatusEnum.NotLoaded);
      void expect(async () => {
        await app.load({} as IAppSwitcherContext);
      }).rejects.toThrowError('Can not find loadApp prop');
      expect(app.status).toBe(StatusEnum.Broken);
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
        await app.load({} as IAppSwitcherContext);
      } catch (error) {
        expect(app.status).toBe(StatusEnum.LoadError);
      }
    });
  });

  describe('App.bootstrap', () => {
    test('bootstrap 应用之前和之后，应用的状态变化应该正确', async () => {
      const app = getAppWithLoadOptions({ name: 'app' });
      await app.load({} as IAppSwitcherContext);

      expect(app.status).toBe(StatusEnum.NotBootstrapped);
      const promise = app.bootstrap({} as IAppSwitcherContext);
      expect(app.status).toBe(StatusEnum.Bootstrapping);
      await promise;
      expect(app.status).toBe(StatusEnum.NotMounted);
    });

    test('没有 bootstrap 的 hook，应用的状态变化应该正确', async () => {
      const app = getAppWithLoadOptions({ name: 'app' }, { bootstrap: undefined });
      await app.load({} as IAppSwitcherContext);

      expect(app.status).toBe(StatusEnum.NotBootstrapped);
      await app.bootstrap({} as IAppSwitcherContext);
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
      await app.load({} as IAppSwitcherContext);

      try {
        await app.bootstrap({} as IAppSwitcherContext);
      } catch (error) {
        expect(app.status).toBe(StatusEnum.Broken);
      }
    });
  });

  describe('App.mount', () => {
    test('mount 应用之前和之后，应用的状态变化应该正确', async () => {
      const app = getAppWithLoadOptions({ name: 'app' });
      await app.load({} as IAppSwitcherContext);
      await app.bootstrap({} as IAppSwitcherContext);

      expect(app.status).toBe(StatusEnum.NotMounted);
      const promise = app.mount({} as IAppSwitcherContext);
      expect(app.status).toBe(StatusEnum.Mounting);
      await promise;
      expect(app.status).toBe(StatusEnum.Mounted);
    });

    test('没有 mount 的 hook，应用的状态变化应该正确', async () => {
      const app = getAppWithLoadOptions({ name: 'app' }, { mount: undefined });
      await app.load({} as IAppSwitcherContext);
      await app.bootstrap({} as IAppSwitcherContext);

      expect(app.status).toBe(StatusEnum.NotMounted);
      await app.mount({} as IAppSwitcherContext);
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
      await app.load({} as IAppSwitcherContext);
      await app.bootstrap({} as IAppSwitcherContext);

      try {
        await app.mount({} as IAppSwitcherContext);
      } catch (error) {
        expect(app.status).toBe(StatusEnum.Broken);
      }
    });
  });

  describe('App.waitForChildContainer', () => {
    test('mount 应之后，可以等待该应用的子容器渲染完成。', async () => {
      const test = jest.fn(() => 1);
      const app = getAppWithLoadOptions(
        { name: 'app' },
        {},
        {
          foo: async () => {
            await delay(1);
            return test();
          },
        },
      );

      await app.load({} as IAppSwitcherContext);
      await app.bootstrap({} as IAppSwitcherContext);
      await app.mount({} as IAppSwitcherContext);
      await app.waitForChildContainer('foo', {} as IAppSwitcherContext);

      expect(test).toHaveBeenCalled();
    });
  });

  describe('App.unmount', () => {
    test('unmount 应用之前和之后，应用的状态变化应该正确', async () => {
      const app = getAppWithLoadOptions({ name: 'app' }, {});
      await app.load({} as IAppSwitcherContext);
      await app.bootstrap({} as IAppSwitcherContext);
      await app.mount({} as IAppSwitcherContext);

      expect(app.status).toBe(StatusEnum.Mounted);
      const promise = app.unmount({} as IAppSwitcherContext);
      expect(app.status).toBe(StatusEnum.Unmounting);
      await promise;
      expect(app.status).toBe(StatusEnum.NotMounted);
    });

    test('没有 unmount 的 hook，应用的状态变化应该正确', async () => {
      const app = getAppWithLoadOptions({ name: 'app' }, { unmount: undefined });
      await app.load({} as IAppSwitcherContext);
      await app.bootstrap({} as IAppSwitcherContext);
      await app.mount({} as IAppSwitcherContext);

      expect(app.status).toBe(StatusEnum.Mounted);
      await app.unmount({} as IAppSwitcherContext);
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
      await app.load({} as IAppSwitcherContext);
      await app.bootstrap({} as IAppSwitcherContext);
      await app.mount({} as IAppSwitcherContext);

      try {
        await app.unmount({} as IAppSwitcherContext);
      } catch (error) {
        expect(app.status).toBe(StatusEnum.Broken);
      }
    });
  });
});
