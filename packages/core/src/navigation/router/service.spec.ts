import { LocationMock } from '@jedmao/location';
import { Container } from 'inversify';

import { buildProviderModule, IRouterKey, IRouter, IMatcher, IMatcherKey, provideValue, IConfigKey } from '../../';

const defaultLocation = window.location;
afterEach(() => {
  window.location = defaultLocation;
});

Object.defineProperty(window, 'location', {
  configurable: true,
  enumerable: true,
  writable: true,
  value: defaultLocation,
});

function createContainer(): Container {
  const container = new Container({ defaultScope: 'Singleton' });
  container.load(buildProviderModule(container));
  return container;
}

/**
 * unit
 * @author shushan.cai
 */
describe('Router.match', () => {
  describe('Hash mode', () => {
    test('调用 match 时匹配使用的路径应该是 window.location.hash 部分的路径', () => {
      provideValue({ routerMode: 'hash' }, IConfigKey);
      const container = createContainer();
      const router = container.get<IRouter>(IRouterKey);
      const matcher = container.get<IMatcher>(IMatcherKey);
      window.location = new LocationMock('https://www.xxx.com#/test');
      const spy = jest.spyOn(matcher, 'match');

      router.match();

      expect(spy).toHaveBeenCalledWith('/test/', {});
    });

    test('调用 match 时匹配使用的 query 应该是 window.location.hash 部分的 query', () => {
      provideValue({ routerMode: 'hash' }, IConfigKey);
      const container = createContainer();
      const router = container.get<IRouter>(IRouterKey);
      const matcher = container.get<IMatcher>(IMatcherKey);
      const spy = jest.spyOn(matcher, 'match');
      window.location = new LocationMock('https://www.xxx.com/#/test?mode=hash');

      router.match();

      expect(spy).toHaveBeenCalledWith('/test/', { mode: 'hash' });
    });
  });

  describe('History mode', () => {
    test('调用 match 时匹配使用的路径应该是 window.location.pathname', () => {
      provideValue({ routerMode: 'history' }, IConfigKey);
      const container = createContainer();
      const router = container.get<IRouter>(IRouterKey);
      const matcher = container.get<IMatcher>(IMatcherKey);
      const spy = jest.spyOn(matcher, 'match');
      window.location = new LocationMock('https://www.xxx.com/test');

      router.match();

      expect(spy).toHaveBeenCalledWith('/test/', {});
    });

    test('调用 match 时匹配使用的 query 应该是 window.location.search 的解析结果', () => {
      provideValue({ routerMode: 'history' }, IConfigKey);
      const container = createContainer();
      const router = container.get<IRouter>(IRouterKey);
      const matcher = container.get<IMatcher>(IMatcherKey);
      const spy = jest.spyOn(matcher, 'match');
      window.location = new LocationMock('https://www.xxx.com/test?mode=history');

      router.match();

      expect(spy).toHaveBeenCalledWith('/test/', { mode: 'history' });
    });
  });
});
