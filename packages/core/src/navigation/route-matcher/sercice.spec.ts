import { Container } from 'inversify';

import { buildProviderModule } from '../../provider';
import { IRouteMatcherKey, IRouteMatcher } from './service';

function getRouteMatch(): IRouteMatcher {
  const container = new Container();
  container.load(buildProviderModule());
  return container.get<IRouteMatcher>(IRouteMatcherKey);
}

/**
 * unit
 * @author huchao
 */
describe('RouteMather.match', () => {
  test('相同的路径，应当匹配成功', () => {
    const routeMatcher = getRouteMatch();
    expect(routeMatcher.match('/a/b/c', '/a/b')).toBe(true);
  });

  test('不同的路径，应当匹配失败', () => {
    const routeMatcher = getRouteMatch();
    expect(routeMatcher.match('/a/c/c', '/a/b')).toBe(false);
  });

  test('带有参数的路径且路径相同，应当匹配成功', () => {
    const routeMatcher = getRouteMatch();
    expect(routeMatcher.match('/a/b', '/a/:id')).toBe(true);
  });

  test('带有参数的路径且路径相同，应当匹配成功且返回正确的参数', () => {
    const routeMatcher = getRouteMatch();
    const params = {};
    const isMatch = routeMatcher.match('/a/3', '/a/:id', params);

    expect(isMatch).toBe(true);
    expect(params).toStrictEqual({ id: '3' });
  });

  test('带有多个参数的路径且路径相同，应当匹配成功且返回正确的参数', () => {
    const routeMatcher = getRouteMatch();
    const params = {};
    const isMatch = routeMatcher.match('/a/3/4/b', '/a/:id/:type', params);

    expect(isMatch).toBe(true);
    expect(params).toStrictEqual({ id: '3', type: '4' });
  });

  test('带有 wildcard 的路径且路径相同，应当匹配成功且返回正确的参数', () => {
    const routeMatcher = getRouteMatch();
    const params = {};
    const isMatch = routeMatcher.match('/a/b/c', '/a/(.*)', params);

    expect(isMatch).toBe(true);
    expect(params).toStrictEqual({ pathMatch: 'b/c' });
  });
});
