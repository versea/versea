import { VerseaTimeoutError } from '@versea/shared';
import { Container } from 'inversify';

import {
  buildProviderModule,
  AppConfig,
  AppLifeCycles,
  AppMountedResult,
  IApp,
  IAppService,
  IAppSwitcherContext,
  IStatus,
  MatchedRoute,
  provideValue,
  IConfig,
} from '../../';

async function delay(time: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, time * 100);
  });
}

let Status: IStatus = undefined as unknown as IStatus;

function getAppInstance(config: AppConfig): IApp {
  const container = new Container({ defaultScope: 'Singleton' });
  container.load(buildProviderModule(container));
  Status = container.get(IStatus);
  const appService = container.get<IAppService>(IAppService);
  return appService.registerApp(config);
}

function getAppWithLoadHook(
  config: AppConfig,
  hooks: AppLifeCycles = {},
  result: AppMountedResult = {} as AppMountedResult,
): IApp {
  return getAppInstance({
    loadApp: async () => {
      return Promise.resolve({
        mount: async () => {
          await delay(1);
          return result;
        },
        unmount: async () => {
          await delay(1);
          return;
        },
        ...hooks,
      });
    },
    ...config,
  });
}

/**
 * unit
 * @author huchao
 */
describe('App', () => {
  describe('App.load', () => {
    test('应用 load 之前和之后，应用的状态变化应该正确', async () => {
      const app = getAppInstance({
        name: 'app',
        loadApp: async () => {
          await delay(1);
          return Promise.resolve({});
        },
      });

      expect(app.status).toBe(Status.NotLoaded);
      const promise = app.load({} as IAppSwitcherContext);
      expect(app.status).toBe(Status.LoadingSourceCode);
      await promise;
      expect(app.status).toBe(Status.NotMounted);
    });

    test('实例化应用时没有 loadApp 参数，加载应用时会报错', () => {
      const app = getAppInstance({ name: 'app' });

      expect(app.status).toBe(Status.NotLoaded);
      void expect(async () => {
        await app.load({} as IAppSwitcherContext);
      }).rejects.toThrowError('Can not find loadApp prop');
      expect(app.status).toBe(Status.Broken);
    });

    test('应用 load 失败，应用的状态变化为 LoadError', async () => {
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
        expect(app.status).toBe(Status.LoadError);
      }
    });
  });

  describe('App.mount', () => {
    test('应用 mount 之前和之后，应用的状态变化应该正确', async () => {
      const app = getAppWithLoadHook({ name: 'app' });
      await app.load({} as IAppSwitcherContext);

      expect(app.status).toBe(Status.NotMounted);
      const promise = app.mount({} as IAppSwitcherContext, {} as MatchedRoute);
      expect(app.status).toBe(Status.Mounting);
      await promise;
      expect(app.status).toBe(Status.Mounted);
    });

    test('没有 mount 的 hook，应用的状态变化应该正确', async () => {
      const app = getAppWithLoadHook({ name: 'app' }, { mount: undefined });
      await app.load({} as IAppSwitcherContext);

      expect(app.status).toBe(Status.NotMounted);
      await app.mount({} as IAppSwitcherContext, {} as MatchedRoute);
      expect(app.status).toBe(Status.Mounted);
    });

    test('应用 mount 失败，应用的状态变化为 broken', async () => {
      const app = getAppWithLoadHook(
        { name: 'app' },
        {
          mount: async () => {
            await delay(1);
            throw new Error('mount error');
          },
        },
      );
      await app.load({} as IAppSwitcherContext);

      try {
        await app.mount({} as IAppSwitcherContext, {} as MatchedRoute);
      } catch (error) {
        expect(app.status).toBe(Status.Broken);
      }
    });
  });

  describe('App.waitForChildContainer', () => {
    test('应用 mount 之后，可以等待该应用的子容器渲染完成。', async () => {
      const test = jest.fn(() => 1);
      const app = getAppWithLoadHook(
        { name: 'app' },
        {},
        {
          containerController: {
            wait: async () => {
              await delay(1);
              return test();
            },
          },
        },
      );

      await app.load({} as IAppSwitcherContext);
      await app.mount({} as IAppSwitcherContext, {} as MatchedRoute);
      await app.waitForChildContainer('foo', {} as IAppSwitcherContext);

      expect(test).toHaveBeenCalled();
    });
  });

  describe('App.unmount', () => {
    test('应用 unmount 之前和之后，应用的状态变化应该正确', async () => {
      const app = getAppWithLoadHook({ name: 'app' }, {});
      await app.load({} as IAppSwitcherContext);
      await app.mount({} as IAppSwitcherContext, {} as MatchedRoute);

      expect(app.status).toBe(Status.Mounted);
      const promise = app.unmount({} as IAppSwitcherContext, {} as MatchedRoute);
      expect(app.status).toBe(Status.Unmounting);
      await promise;
      expect(app.status).toBe(Status.NotMounted);
    });

    test('没有 unmount 的 hook，应用的状态变化应该正确', async () => {
      const app = getAppWithLoadHook({ name: 'app' }, { unmount: undefined });
      await app.load({} as IAppSwitcherContext);
      await app.mount({} as IAppSwitcherContext, {} as MatchedRoute);

      expect(app.status).toBe(Status.Mounted);
      await app.unmount({} as IAppSwitcherContext, {} as MatchedRoute);
      expect(app.status).toBe(Status.NotMounted);
    });

    test('应用 unmount 失败，应用的状态变化为 broken', async () => {
      const app = getAppWithLoadHook(
        { name: 'app' },
        {
          unmount: async () => {
            await delay(1);
            throw new Error('unmount error');
          },
        },
      );
      await app.load({} as IAppSwitcherContext);
      await app.mount({} as IAppSwitcherContext, {} as MatchedRoute);

      try {
        await app.unmount({} as IAppSwitcherContext, {} as MatchedRoute);
      } catch (error) {
        expect(app.status).toBe(Status.Broken);
      }
    });
  });

  describe('Task Timeout', () => {
    test('应用 load 超时可以通过配置设置报错处理.', async () => {
      const app = getAppInstance({
        name: 'app',
        loadApp: async () => {
          await delay(5);
          return Promise.resolve({});
        },
        timeoutConfig: { load: { maxTime: 0, dieOnTimeout: true, timeoutMsg: 'loading timeout.' } },
      });

      await expect(app.load()).rejects.toStrictEqual(new VerseaTimeoutError('loading timeout.'));
    });

    test('应用 mount 超时可以通过配置设置报错处理.', async () => {
      const app = getAppWithLoadHook(
        { name: 'app', timeoutConfig: { mount: { maxTime: 0, dieOnTimeout: true, timeoutMsg: 'mounting timeout.' } } },
        {
          mount: async () => {
            return delay(5);
          },
        },
      );

      await app.load();
      await expect(app.mount()).rejects.toStrictEqual(new VerseaTimeoutError('mounting timeout.'));
    });

    test('应用 unmount 超时可以通过配置设置报错处理.', async () => {
      const app = getAppWithLoadHook(
        {
          name: 'app',
          timeoutConfig: { unmount: { maxTime: 0, dieOnTimeout: true, timeoutMsg: 'unmounting timeout.' } },
        },
        {
          mount: async () => Promise.resolve(),
          unmount: async () => {
            return delay(5);
          },
        },
      );

      await app.load();
      await app.mount();
      await expect(app.unmount()).rejects.toStrictEqual(new VerseaTimeoutError('unmounting timeout.'));
    });

    test('应用 waitForChildContainer 超时可以通过配置设置报错处理.', async () => {
      const app = getAppWithLoadHook(
        {
          name: 'app',
          timeoutConfig: {
            waitForChildContainer: { maxTime: 0, dieOnTimeout: true, timeoutMsg: 'waitForChildContainer timeout.' },
          },
        },
        {},
        {
          containerController: {
            wait: async () => {
              console.log('call');
              await delay(5);
              return Promise.resolve();
            },
          },
        },
      );

      await app.load();
      await app.mount();
      await expect(app.waitForChildContainer('foo', {} as IAppSwitcherContext)).rejects.toStrictEqual(
        new VerseaTimeoutError('waitForChildContainer timeout.'),
      );
    });

    test('应用任务可以配置超时抛出警告.', async () => {
      const app = getAppInstance({
        name: 'app',
        loadApp: async () => {
          await delay(5);
          return Promise.resolve({});
        },
        timeoutConfig: { load: { maxTime: 0, dieOnTimeout: false, timeoutMsg: 'loading timeout.' } },
      });

      jest.spyOn(console, 'warn');

      await app.load();
      expect(console.warn).toHaveBeenCalledWith('[versea] loading timeout.');
    });

    test('可以接收到应用任务在超时之前抛出的错误.', async () => {
      const app = getAppInstance({
        name: 'app',
        loadApp: async () => {
          return Promise.reject(new Error('task error'));
        },
      });

      await expect(app.load()).rejects.toStrictEqual(new Error('task error'));
    });

    test('超时配置读取优先级: 全局IConfig配置 < 每个app在注册时的配置.', async () => {
      provideValue(
        { timeoutConfig: { load: { maxTime: 0, dieOnTimeout: true, timeoutMsg: 'loading timeout at IConfig.' } } },
        IConfig,
      );
      const app1 = getAppInstance({
        name: 'app1',
        loadApp: async () => {
          await delay(5);
          return Promise.resolve({});
        },
      });

      await expect(app1.load()).rejects.toStrictEqual(new VerseaTimeoutError('loading timeout at IConfig.'));

      const app2 = getAppInstance({
        name: 'app2',
        loadApp: async () => {
          await delay(5);
          return Promise.resolve({});
        },
        timeoutConfig: { load: { maxTime: 0, dieOnTimeout: true, timeoutMsg: 'loading timeout at App config.' } },
      });

      await expect(app2.load()).rejects.toStrictEqual(new VerseaTimeoutError('loading timeout at App config.'));
    });
  });
});
