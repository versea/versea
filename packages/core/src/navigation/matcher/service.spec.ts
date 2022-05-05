/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Container, interfaces } from 'inversify';

import { buildProviderModule, IApp, IAppKey, IMatcher, IMatcherKey, IStatusKey } from '../../';

function createContainer(): Container {
  const container = new Container({ defaultScope: 'Singleton' });
  container.load(buildProviderModule(container));
  return container;
}

function getAppInstance(container: Container, appName: string): IApp {
  const App = container.get<interfaces.Newable<IApp>>(IAppKey);
  // @ts-expect-error 这里需要向 App 传入构造函数参数
  return new App({ name: appName }, { Status: container.get(IStatusKey) });
}

/**
 * unit
 * @author huchao
 */
describe('Matcher', () => {
  describe('创建与合并路由节点', () => {
    test('创建 route 节点，Matcher.trees 应该返回节点信息。', () => {
      const container = createContainer();
      const matcher = container.get<IMatcher>(IMatcherKey);
      const app = getAppInstance(container, 'name1');
      matcher.addRoutes([{ path: 'path1' }], app);

      expect((matcher as any)._trees).toMatchObject([
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

    test('创建两个相同路径的 route 根节点，Matcher.trees 应该合并节点。', () => {
      const container = createContainer();
      const matcher = container.get<IMatcher>(IMatcherKey);
      const app1 = getAppInstance(container, 'name1');
      matcher.addRoutes([{ path: 'path1', meta: { test: 'test' } }], app1);
      const app2 = getAppInstance(container, 'name2');
      matcher.addRoutes(
        [{ path: 'path1', isFragment: true, meta: { parentAppName: 'name1', parentContainerName: 'container1' } }],
        app2,
      );

      expect((matcher as any)._trees).toMatchObject([
        {
          path: '/path1',
          apps: [
            {
              name: 'name1',
            },
            {
              name: 'name2',
            },
          ],
          meta: {
            test: 'test',
            name2: {
              parentAppName: 'name1',
              parentContainerName: 'container1',
            },
          },
        },
      ]);
    });

    test('创建多个相同路径的 route 的子节点，Matcher.trees 应该合并节点。', () => {
      const container = createContainer();
      const matcher = container.get<IMatcher>(IMatcherKey);
      const app1 = getAppInstance(container, 'name1');
      matcher.addRoutes([{ path: 'path1' }], app1);
      const app2 = getAppInstance(container, 'name2');
      matcher.addRoutes([{ path: 'path2' }], app2);
      const app3 = getAppInstance(container, 'name3');
      matcher.addRoutes(
        [{ path: 'path2', isFragment: true, meta: { parentAppName: 'name2', parentContainerName: 'container2' } }],
        app3,
      );
      const app4 = getAppInstance(container, 'name4');
      matcher.addRoutes(
        [{ path: 'path1', isFragment: true, meta: { parentAppName: 'name1', parentContainerName: 'container1' } }],
        app4,
      );
      const app5 = getAppInstance(container, 'name5');
      matcher.addRoutes([{ path: 'path3' }], app5);

      expect((matcher as any)._trees).toMatchObject([
        {
          path: '/path1',
          apps: [
            {
              name: 'name1',
            },
            {
              name: 'name4',
            },
          ],
        },
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
        {
          path: '/path3',
          apps: [
            {
              name: 'name5',
            },
          ],
        },
      ]);
    });

    test('创建两个具有嵌套能力的节点（先创建插槽，后创建填充），Matcher.trees 应该返回嵌套的结构。', () => {
      const container = createContainer();
      const matcher = container.get<IMatcher>(IMatcherKey);
      const app1 = getAppInstance(container, 'name1');
      matcher.addRoutes([{ path: 'path1', slot: 'foo' }], app1);
      const app2 = getAppInstance(container, 'name2');
      matcher.addRoutes([{ path: 'path2', fill: 'foo' }], app2);

      expect((matcher as any)._trees).toMatchObject([
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

    test('创建两个具有嵌套能力的节点（先创建填充，后创建插槽），Matcher.trees 应该返回嵌套的结构。', () => {
      const container = createContainer();
      const matcher = container.get<IMatcher>(IMatcherKey);
      const app2 = getAppInstance(container, 'name2');
      matcher.addRoutes([{ path: 'path2', fill: 'foo' }], app2);
      const app1 = getAppInstance(container, 'name1');
      matcher.addRoutes([{ path: 'path1', slot: 'foo' }], app1);

      expect((matcher as any)._trees).toMatchObject([
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

    test('创建两个具有嵌套能力的节点，填充和插槽不匹配，Matcher.trees 应该返回非嵌套的结构。', () => {
      const container = createContainer();
      const matcher = container.get<IMatcher>(IMatcherKey);
      const app1 = getAppInstance(container, 'name1');
      matcher.addRoutes([{ path: 'path1', slot: 'foo' }], app1);
      const app2 = getAppInstance(container, 'name2');
      matcher.addRoutes([{ path: 'path2', fill: 'other' }], app2);

      expect((matcher as any)._trees).toMatchObject([
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

    test('合并路由树时，具有 wildcard 匹配的节点应该在 children 数组的最后。', () => {
      const container = createContainer();
      const matcher = container.get<IMatcher>(IMatcherKey);
      const app1 = getAppInstance(container, 'name1');
      matcher.addRoutes([{ path: 'path1', slot: 'foo', children: [{ path: 'path1' }, { path: '(.*)' }] }], app1);
      const app2 = getAppInstance(container, 'name2');
      matcher.addRoutes([{ path: 'path2', fill: 'foo' }], app2);

      expect((matcher as any)._trees).toMatchObject([
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

    test('创建多个具有嵌套能力的节点，Matcher.trees 应该能返回嵌套的结构。', () => {
      const container = createContainer();
      const matcher = container.get<IMatcher>(IMatcherKey);
      const app1 = getAppInstance(container, 'name1');
      matcher.addRoutes([{ path: 'path1', slot: 'foo' }], app1);
      const app2 = getAppInstance(container, 'name2');
      matcher.addRoutes([{ path: 'path2', fill: 'foo' }], app2);
      const app3 = getAppInstance(container, 'name3');
      matcher.addRoutes([{ path: 'path3', fill: 'foo' }], app3);

      expect((matcher as any)._trees).toMatchObject([
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

    test('创建多个具有嵌套能力的节点，相同路径的结点应该可以正确合并，Matcher.trees 应该返回正确的嵌套结构。', () => {
      const container = createContainer();
      const matcher = container.get<IMatcher>(IMatcherKey);
      const app1 = getAppInstance(container, 'name1');
      matcher.addRoutes([{ path: 'path1', slot: 'foo' }], app1);
      const app2 = getAppInstance(container, 'name2');
      matcher.addRoutes([{ path: 'path2', fill: 'foo' }], app2);
      const app3 = getAppInstance(container, 'name3');
      matcher.addRoutes(
        [
          {
            path: 'path2',
            fill: 'foo',
            isFragment: true,
            meta: { parentAppName: 'name2', parentContainerName: 'container2' },
          },
        ],
        app3,
      );

      expect((matcher as any)._trees).toMatchObject([
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

    test('创建多个具有嵌套能力的节点，相同路径的结点合并，合并的路由的 children 的 parent 应该能指向正确', () => {
      const container = createContainer();
      const matcher = container.get<IMatcher>(IMatcherKey);
      const app1 = getAppInstance(container, 'name1');
      matcher.addRoutes([{ path: 'path1', slot: 'foo' }], app1);
      const app2 = getAppInstance(container, 'name2');
      matcher.addRoutes(
        [
          {
            path: 'path2',
            fill: 'foo',
            isFragment: true,
            meta: { parentAppName: 'name1', parentContainerName: 'container1' },
          },
        ],
        app2,
      );
      const app3 = getAppInstance(container, 'name3');
      matcher.addRoutes([{ path: 'path2', fill: 'foo', children: [{ path: 'path3' }] }], app3);

      expect((matcher as any)._trees[0].children[0].children[0].parent).toBe((matcher as any)._trees[0].children[0]);
    });

    test('创建多个具有嵌套能力的节点，相同路径的结点合并时，路由都不是碎片的路由合并应该 throw error。', () => {
      const container = createContainer();
      const matcher = container.get<IMatcher>(IMatcherKey);
      const app1 = getAppInstance(container, 'name1');
      matcher.addRoutes([{ path: 'path1', slot: 'foo' }], app1);
      const app2 = getAppInstance(container, 'name2');
      matcher.addRoutes([{ path: 'path2', fill: 'foo', children: [{ path: 'path3' }] }], app2);
      const app3 = getAppInstance(container, 'name3');

      expect(() => {
        matcher.addRoutes([{ path: 'path2', fill: 'foo', children: [{ path: 'path4' }] }], app3);
      }).toThrowError('Can not Merge route(same path)');
    });

    test('声明两个具有相同插槽名称的路由节点，应当 throw error。', () => {
      const container = createContainer();
      const matcher = container.get<IMatcher>(IMatcherKey);
      const app1 = getAppInstance(container, 'name1');
      matcher.addRoutes([{ path: 'path1', slot: 'foo' }], app1);
      const app2 = getAppInstance(container, 'name2');

      expect(() => {
        matcher.addRoutes([{ path: 'path2', slot: 'foo' }], app2);
      }).toThrowError('Duplicate slot key');
    });

    test('trees 应该可以被序列化。', () => {
      const container = createContainer();
      const matcher = container.get<IMatcher>(IMatcherKey);
      const app = getAppInstance(container, 'name1');
      matcher.addRoutes([{ path: 'path1', children: [{ path: 'path2' }] }], app);

      expect(() => JSON.stringify((matcher as any)._trees)).not.toThrowError();
    });
  });

  describe('匹配路由节点', () => {
    test('节点路由与传入的路由相同，应该可以匹配', () => {
      const container = createContainer();
      const matcher = container.get<IMatcher>(IMatcherKey);
      const app = getAppInstance(container, 'name1');
      matcher.addRoutes([{ path: 'path1' }], app);

      expect(matcher.match('/path1', {}).routes).toMatchObject([
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

    test('根据匹配的结果反查的 route 节点，应该能正确返回 route 节点', () => {
      const container = createContainer();
      const matcher = container.get<IMatcher>(IMatcherKey);
      const app = getAppInstance(container, 'name1');
      matcher.addRoutes([{ path: 'path1' }], app);

      const matched = matcher.match('/path1', {});
      expect(matched.routes[0].getRoute()).toMatchObject({
        path: '/path1',
        apps: [
          {
            name: 'name1',
          },
        ],
        meta: {},
      });
    });

    test('节点路由与传入的路由不同，应该不可以匹配', () => {
      const container = createContainer();
      const matcher = container.get<IMatcher>(IMatcherKey);
      const app = getAppInstance(container, 'name1');
      matcher.addRoutes([{ path: 'path1' }], app);

      expect(matcher.match('/path2', {}).routes).toEqual([]);
    });

    test('带有参数的路径且路径相同，应该匹配成功且返回正确的参数', () => {
      const container = createContainer();
      const matcher = container.get<IMatcher>(IMatcherKey);
      const app = getAppInstance(container, 'name1');
      matcher.addRoutes([{ path: 'path1/:id' }], app);

      expect(matcher.match('/path1/1/path2', {}).routes).toMatchObject([
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

    test('带有多个参数的路径且路径相同，应该匹配成功且返回正确的参数', () => {
      const container = createContainer();
      const matcher = container.get<IMatcher>(IMatcherKey);
      const app = getAppInstance(container, 'name1');
      matcher.addRoutes([{ path: 'path1/:id/:type' }], app);

      expect(matcher.match('/path1/1/type1', {}).routes).toMatchObject([
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

    test('带有 wildcard 的路径且路径相同，应该匹配成功且返回正确的参数', () => {
      const container = createContainer();
      const matcher = container.get<IMatcher>(IMatcherKey);
      const app = getAppInstance(container, 'name1');
      matcher.addRoutes([{ path: 'path1/(.*)' }], app);

      expect(matcher.match('/path1/1/2', {}).routes).toMatchObject([
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

    test('嵌套的路由，应该可以多级匹配', () => {
      const container = createContainer();
      const matcher = container.get<IMatcher>(IMatcherKey);
      const app = getAppInstance(container, 'name1');
      matcher.addRoutes(
        [{ path: 'path1', children: [{ path: ':id', children: [{ path: ':type/path4' }] }, { path: 'path3' }] }],
        app,
      );

      expect(matcher.match('/path1/1/type/path4', {}).routes).toMatchObject([
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

    test('匹配的结果的 App 的实例应该与创建的 App 是同一个实例。', () => {
      const container = createContainer();
      const matcher = container.get<IMatcher>(IMatcherKey);
      const app = getAppInstance(container, 'name1');
      matcher.addRoutes([{ path: 'path1' }], app);

      expect(matcher.match('/path1', {}).routes[0].apps[0]).toBe(app);
    });
  });
});
