/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Container, interfaces } from 'inversify';

import { IApp, IAppKey, IStatusEnumKey } from '../../application/app/service';
import { buildProviderModule } from '../../provider';
import { IMatcher, IMatcherKey } from './service';

function getMatcher(): IMatcher {
  const container = new Container({ defaultScope: 'Singleton' });
  container.load(buildProviderModule());
  return container.get<IMatcher>(IMatcherKey);
}

function getAppInstance(appName: string): IApp {
  const container = new Container({ defaultScope: 'Singleton' });
  container.load(buildProviderModule());
  const App = container.get<interfaces.Newable<IApp>>(IAppKey);
  // @ts-expect-error 这里需要向 App 传入构造函数参数
  return new App({ name: appName }, { StatusEnum: container.get(IStatusEnumKey) });
}

/**
 * unit
 * @author huchao
 */
describe('Matcher', () => {
  describe('创建并合并路由节点', () => {
    test('创建一个 route 节点，Matcher.trees 应该返回配置的节点信息。', () => {
      const matcher = getMatcher();
      const app = getAppInstance('name1');
      matcher.addRoutes([{ path: 'path1' }], app);

      expect((matcher as any).trees).toMatchObject([
        {
          path: '/path1',
          apps: [
            {
              name: 'name1',
            },
          ],
          meta: {},
        },
      ]);
    });

    test('先创建一个路径为 path1 的 route 节点，具有插槽能力，后创建一个路径为 path2 的 route 节点，插入 path1 的 route 节点，Matcher.trees 应该能返回嵌套的结构。', () => {
      const matcher = getMatcher();
      const app1 = getAppInstance('name1');
      matcher.addRoutes([{ path: 'path1', slot: 'foo' }], app1);
      const app2 = getAppInstance('name2');
      matcher.addRoutes([{ path: 'path2', fill: 'foo' }], app2);

      expect((matcher as any).trees).toMatchObject([
        {
          path: '/path1',
          apps: [
            {
              name: 'name1',
            },
          ],
          children: [
            {
              path: '/path2',
              apps: [
                {
                  name: 'name2',
                },
              ],
            },
          ],
        },
      ]);
    });

    test('先创建一个路径为 path2 的 route 节点，插入 path1 的 route 节点，后创建一个路径为 path1 的 route 节点，具有插槽能力，Matcher.trees 应该能返回嵌套的结构。', () => {
      const matcher = getMatcher();
      const app2 = getAppInstance('name2');
      matcher.addRoutes([{ path: 'path2', fill: 'foo' }], app2);
      const app1 = getAppInstance('name1');
      matcher.addRoutes([{ path: 'path1', slot: 'foo' }], app1);

      expect((matcher as any).trees).toMatchObject([
        {
          path: '/path1',
          apps: [
            {
              name: 'name1',
            },
          ],
          children: [
            {
              path: '/path2',
              apps: [
                {
                  name: 'name2',
                },
              ],
            },
          ],
        },
      ]);
    });

    test('先创建一个路径为 path1 的 route 节点，具有插槽能力，后创建一个路径为 path2 的 route 节点，插入 path3 的 route 节点，Matcher.trees 应该能返回非嵌套的结构。', () => {
      const matcher = getMatcher();
      const app1 = getAppInstance('name1');
      matcher.addRoutes([{ path: 'path1', slot: 'foo' }], app1);
      const app2 = getAppInstance('name2');
      matcher.addRoutes([{ path: 'path2', fill: 'other' }], app2);

      expect((matcher as any).trees).toMatchObject([
        {
          path: '/path1',
          apps: [
            {
              name: 'name1',
            },
          ],
        },
        {
          path: '/path2',
          apps: [
            {
              name: 'name2',
            },
          ],
        },
      ]);
    });

    test(`先创建一个路径为 path1 的 route 节点，具有插槽能力，节点具有 wild 匹配，后创建一个路径为 path2 的 route 节点，插入 path1 的 route 节点，Matcher.trees 应该能返回嵌套的结构，且 path2 应该在 wild 匹配 之前，在非 wild 匹配 之后。`, () => {
      const matcher = getMatcher();
      const app1 = getAppInstance('name1');
      matcher.addRoutes([{ path: 'path1', slot: 'foo', children: [{ path: 'path1' }, { path: '(.*)' }] }], app1);
      const app2 = getAppInstance('name2');
      matcher.addRoutes([{ path: 'path2', fill: 'foo' }], app2);

      expect((matcher as any).trees).toMatchObject([
        {
          path: '/path1',
          apps: [
            {
              name: 'name1',
            },
          ],
          children: [
            {
              path: '/path1',
              apps: [
                {
                  name: 'name1',
                },
              ],
            },
            {
              path: '/path2',
              apps: [
                {
                  name: 'name2',
                },
              ],
            },
            {
              path: '/(.*)',
              apps: [
                {
                  name: 'name1',
                },
              ],
            },
          ],
        },
      ]);
    });

    test('先创建一个路径为 path1 的 route 节点，具有插槽能力，后创建一个路径为 path2 的 route 节点，插入 path1 的 route 节点，再创建一个路径为 path3 的 route 节点，插入 path1 的 route 节点，Matcher.trees 应该能返回嵌套的结构。', () => {
      const matcher = getMatcher();
      const app1 = getAppInstance('name1');
      matcher.addRoutes([{ path: 'path1', slot: 'foo' }], app1);
      const app2 = getAppInstance('name2');
      matcher.addRoutes([{ path: 'path2', fill: 'foo' }], app2);
      const app3 = getAppInstance('name3');
      matcher.addRoutes([{ path: 'path3', fill: 'foo' }], app3);

      expect((matcher as any).trees).toMatchObject([
        {
          path: '/path1',
          apps: [
            {
              name: 'name1',
            },
          ],
          children: [
            {
              path: '/path2',
              apps: [
                {
                  name: 'name2',
                },
              ],
            },
            {
              path: '/path3',
              apps: [
                {
                  name: 'name3',
                },
              ],
            },
          ],
        },
      ]);
    });

    test('先创建一个路径为 path1 的 route 节点，具有插槽能力，后创建一个路径为 path2 的 route 节点，插入 path1 的 route 节点，再创建一个路径为 path2 的 route 节点，插入 path1 的 route 节点，Matcher.trees 应该能返回嵌套的结构且合并了 path2 节点信息。', () => {
      const matcher = getMatcher();
      const app1 = getAppInstance('name1');
      matcher.addRoutes([{ path: 'path1', slot: 'foo' }], app1);
      const app2 = getAppInstance('name2');
      matcher.addRoutes([{ path: 'path2', fill: 'foo' }], app2);
      const app3 = getAppInstance('name3');
      matcher.addRoutes([{ path: 'path2', fill: 'foo' }], app3);

      expect((matcher as any).trees).toMatchObject([
        {
          path: '/path1',
          apps: [
            {
              name: 'name1',
            },
          ],
          children: [
            {
              path: '/path2',
              apps: [
                {
                  name: 'name2',
                },
                {
                  name: 'name3',
                },
              ],
            },
          ],
        },
      ]);
    });

    test('同上，合并路由时，合并的路由的 children 的 parent 应该能指向正确', () => {
      const matcher = getMatcher();
      const app1 = getAppInstance('name1');
      matcher.addRoutes([{ path: 'path1', slot: 'foo' }], app1);
      const app2 = getAppInstance('name2');
      matcher.addRoutes([{ path: 'path2', fill: 'foo' }], app2);
      const app3 = getAppInstance('name3');
      matcher.addRoutes([{ path: 'path2', fill: 'foo', children: [{ path: 'path3' }] }], app3);

      expect((matcher as any).trees[0].children[0].children[0].parent).toBe((matcher as any).trees[0].children[0]);
    });

    test('同上，合并路由时，都具有 children 的 路由合并应该 throw error。', () => {
      const matcher = getMatcher();
      const app1 = getAppInstance('name1');
      matcher.addRoutes([{ path: 'path1', slot: 'foo' }], app1);
      const app2 = getAppInstance('name2');
      matcher.addRoutes([{ path: 'path2', fill: 'foo', children: [{ path: 'path3' }] }], app2);
      const app3 = getAppInstance('name3');

      expect(() => {
        matcher.addRoutes([{ path: 'path2', fill: 'foo', children: [{ path: 'path4' }] }], app3);
      }).toThrowError('Can not Merge route(same path)');
    });

    test('同上，合并路由时，任何一个 child 具有 slot 都应该 throw error。', () => {
      const matcher = getMatcher();
      const app1 = getAppInstance('name1');
      matcher.addRoutes([{ path: 'path1', slot: 'foo' }], app1);
      const app2 = getAppInstance('name2');
      matcher.addRoutes([{ path: 'path2', fill: 'foo' }], app2);
      const app3 = getAppInstance('name3');

      expect(() => {
        matcher.addRoutes([{ path: 'path2', fill: 'foo', slot: 'other' }], app3);
      }).toThrowError('Can not Merge route(same path)');
    });

    test('声明两个具有相同插槽字段的路由节点，应当 throw error。', () => {
      const matcher = getMatcher();
      const app1 = getAppInstance('name1');
      matcher.addRoutes([{ path: 'path1', slot: 'foo' }], app1);
      const app2 = getAppInstance('name2');

      expect(() => {
        matcher.addRoutes([{ path: 'path2', slot: 'foo' }], app2);
      }).toThrowError('Duplicate slot key');
    });

    test('trees 应该可以被序列化。', () => {
      const matcher = getMatcher();
      const app = getAppInstance('name1');
      matcher.addRoutes([{ path: 'path1', children: [{ path: 'path2' }] }], app);

      expect(() => JSON.stringify((matcher as any).trees)).not.toThrowError();
    });
  });

  describe('匹配路由节点', () => {
    test('节点路由信息与传入的路由相同，应该可以匹配', () => {
      const matcher = getMatcher();
      const app = getAppInstance('name1');
      matcher.addRoutes([{ path: 'path1' }], app);

      expect(matcher.match('/path1', {})).toMatchObject([
        {
          path: '/path1',
          apps: [
            {
              name: 'name1',
            },
          ],
          meta: {},
        },
      ]);
    });

    test('节点路由信息与传入的路由不同，应该不可以匹配', () => {
      const matcher = getMatcher();
      const app = getAppInstance('name1');
      matcher.addRoutes([{ path: 'path1' }], app);

      expect(matcher.match('/path2', {})).toEqual([]);
    });

    test('带有参数的路径且路径相同，应当匹配成功且返回正确的参数', () => {
      const matcher = getMatcher();
      const app = getAppInstance('name1');
      matcher.addRoutes([{ path: 'path1/:id' }], app);

      expect(matcher.match('/path1/1/path2', {})).toMatchObject([
        {
          path: '/path1/:id',
          apps: [
            {
              name: 'name1',
            },
          ],
          meta: {},
          params: {
            id: '1',
          },
        },
      ]);
    });

    test('带有多个参数的路径且路径相同，应当匹配成功且返回正确的参数', () => {
      const matcher = getMatcher();
      const app = getAppInstance('name1');
      matcher.addRoutes([{ path: 'path1/:id/:type' }], app);

      expect(matcher.match('/path1/1/type1', {})).toMatchObject([
        {
          path: '/path1/:id/:type',
          apps: [
            {
              name: 'name1',
            },
          ],
          meta: {},
          params: {
            id: '1',
            type: 'type1',
          },
        },
      ]);
    });

    test('带有 wildcard 的路径且路径相同，应当匹配成功且返回正确的参数', () => {
      const matcher = getMatcher();
      const app = getAppInstance('name1');
      matcher.addRoutes([{ path: 'path1/(.*)' }], app);

      expect(matcher.match('/path1/1/2', {})).toMatchObject([
        {
          path: '/path1/(.*)',
          apps: [
            {
              name: 'name1',
            },
          ],
          meta: {},
          params: {
            pathMatch: '1/2',
          },
        },
      ]);
    });

    test('带有嵌套的路由，应该可以匹配多级', () => {
      const matcher = getMatcher();
      const app = getAppInstance('name1');
      matcher.addRoutes(
        [{ path: 'path1', children: [{ path: ':id', children: [{ path: ':type/path4' }] }, { path: 'path3' }] }],
        app,
      );

      expect(matcher.match('/path1/1/type/path4', {})).toMatchObject([
        {
          path: '/path1',
          fullPath: '/path1',
          apps: [
            {
              name: 'name1',
            },
          ],
          meta: {},
        },
        {
          path: '/:id',
          fullPath: '/path1/:id',
          apps: [
            {
              name: 'name1',
            },
          ],
          meta: {},
          params: {
            id: '1',
          },
        },
        {
          path: '/:type/path4',
          fullPath: '/path1/:id/:type/path4',
          apps: [
            {
              name: 'name1',
            },
          ],
          meta: {},
          params: {
            id: '1',
            type: 'type',
          },
        },
      ]);
    });
  });
});
