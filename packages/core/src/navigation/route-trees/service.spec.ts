/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Container, interfaces } from 'inversify';

import { IApp, IAppKey } from '../../application/app/service';
import { buildProviderModule } from '../../provider';
import { IRouteTrees, IRouteTreesKey } from './service';

function getRouteTrees(): IRouteTrees {
  const container = new Container();
  container.load(buildProviderModule());
  return container.get<IRouteTrees>(IRouteTreesKey);
}

function getAppInstance(appName): IApp {
  const container = new Container();
  container.load(buildProviderModule());
  const App = container.get<interfaces.Newable<IApp>>(IAppKey);
  // @ts-expect-error 这里需要向 App 传入构造函数参数
  return new App({ name: appName });
}

/**
 * unit
 * @author huchao
 */
describe('RouteTrees', () => {
  describe('创建并合并路由节点', () => {
    test('创建一个 route 节点，RouteTrees.trees 应该返回配置的节点信息。', () => {
      const routeTrees = getRouteTrees();
      const app = getAppInstance('name1');
      routeTrees.createTree([{ path: 'path1' }], app);

      expect((routeTrees as any).trees).toMatchObject([
        {
          path: 'path1',
          apps: [
            {
              name: 'name1',
            },
          ],
          meta: {},
        },
      ]);
    });

    test('先创建一个路径为 path1 的 route 节点，具有插槽能力，后创建一个路径为 path2 的 route 节点，插入 path1 的 route 节点，RouteTrees.trees 应该能返回嵌套的结构。', () => {
      const routeTrees = getRouteTrees();
      const app1 = getAppInstance('name1');
      routeTrees.createTree([{ path: 'path1', slot: 'foo' }], app1);
      const app2 = getAppInstance('name2');
      routeTrees.createTree([{ path: 'path2', fill: 'foo' }], app2);

      expect((routeTrees as any).trees).toMatchObject([
        {
          path: 'path1',
          apps: [
            {
              name: 'name1',
            },
          ],
          children: [
            {
              path: 'path2',
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

    test('先创建一个路径为 path2 的 route 节点，插入 path1 的 route 节点，后创建一个路径为 path1 的 route 节点，具有插槽能力，RouteTrees.trees 应该能返回嵌套的结构。', () => {
      const routeTrees = getRouteTrees();
      const app2 = getAppInstance('name2');
      routeTrees.createTree([{ path: 'path2', fill: 'foo' }], app2);
      const app1 = getAppInstance('name1');
      routeTrees.createTree([{ path: 'path1', slot: 'foo' }], app1);

      expect((routeTrees as any).trees).toMatchObject([
        {
          path: 'path1',
          apps: [
            {
              name: 'name1',
            },
          ],
          children: [
            {
              path: 'path2',
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

    test('先创建一个路径为 path1 的 route 节点，具有插槽能力，后创建一个路径为 path2 的 route 节点，插入 path3 的 route 节点，RouteTrees.trees 应该能返回非嵌套的结构。', () => {
      const routeTrees = getRouteTrees();
      const app1 = getAppInstance('name1');
      routeTrees.createTree([{ path: 'path1', slot: 'foo' }], app1);
      const app2 = getAppInstance('name2');
      routeTrees.createTree([{ path: 'path2', fill: 'other' }], app2);

      expect((routeTrees as any).trees).toMatchObject([
        {
          path: 'path1',
          apps: [
            {
              name: 'name1',
            },
          ],
        },
        {
          path: 'path2',
          apps: [
            {
              name: 'name2',
            },
          ],
        },
      ]);
    });

    test(`先创建一个路径为 path1 的 route 节点，具有插槽能力，节点具有 wild 匹配，后创建一个路径为 path2 的 route 节点，插入 path1 的 route 节点，RouteTrees.trees 应该能返回嵌套的结构，且 path2 应该在 wild 匹配 之前，在非 wild 匹配 之后。`, () => {
      const routeTrees = getRouteTrees();
      const app1 = getAppInstance('name1');
      routeTrees.createTree([{ path: 'path1', slot: 'foo', children: [{ path: 'path1' }, { path: '.*' }] }], app1);
      const app2 = getAppInstance('name2');
      routeTrees.createTree([{ path: 'path2', fill: 'foo' }], app2);

      expect((routeTrees as any).trees).toMatchObject([
        {
          path: 'path1',
          apps: [
            {
              name: 'name1',
            },
          ],
          children: [
            {
              path: 'path1',
              apps: [
                {
                  name: 'name1',
                },
              ],
            },
            {
              path: 'path2',
              apps: [
                {
                  name: 'name2',
                },
              ],
            },
            {
              path: '.*',
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

    test('先创建一个路径为 path1 的 route 节点，具有插槽能力，后创建一个路径为 path2 的 route 节点，插入 path1 的 route 节点，再创建一个路径为 path3 的 route 节点，插入 path1 的 route 节点，RouteTrees.trees 应该能返回嵌套的结构。', () => {
      const routeTrees = getRouteTrees();
      const app1 = getAppInstance('name1');
      routeTrees.createTree([{ path: 'path1', slot: 'foo' }], app1);
      const app2 = getAppInstance('name2');
      routeTrees.createTree([{ path: 'path2', fill: 'foo' }], app2);
      const app3 = getAppInstance('name3');
      routeTrees.createTree([{ path: 'path3', fill: 'foo' }], app3);

      expect((routeTrees as any).trees).toMatchObject([
        {
          path: 'path1',
          apps: [
            {
              name: 'name1',
            },
          ],
          children: [
            {
              path: 'path2',
              apps: [
                {
                  name: 'name2',
                },
              ],
            },
            {
              path: 'path3',
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

    test('先创建一个路径为 path1 的 route 节点，具有插槽能力，后创建一个路径为 path2 的 route 节点，插入 path1 的 route 节点，再创建一个路径为 path2 的 route 节点，插入 path1 的 route 节点，RouteTrees.trees 应该能返回嵌套的结构且合并了 path2 节点信息。', () => {
      const routeTrees = getRouteTrees();
      const app1 = getAppInstance('name1');
      routeTrees.createTree([{ path: 'path1', slot: 'foo' }], app1);
      const app2 = getAppInstance('name2');
      routeTrees.createTree([{ path: 'path2', fill: 'foo' }], app2);
      const app3 = getAppInstance('name3');
      routeTrees.createTree([{ path: 'path2', fill: 'foo' }], app3);

      expect((routeTrees as any).trees).toMatchObject([
        {
          path: 'path1',
          apps: [
            {
              name: 'name1',
            },
          ],
          children: [
            {
              path: 'path2',
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
      const routeTrees = getRouteTrees();
      const app1 = getAppInstance('name1');
      routeTrees.createTree([{ path: 'path1', slot: 'foo' }], app1);
      const app2 = getAppInstance('name2');
      routeTrees.createTree([{ path: 'path2', fill: 'foo' }], app2);
      const app3 = getAppInstance('name3');
      routeTrees.createTree([{ path: 'path2', fill: 'foo', children: [{ path: 'path3' }] }], app3);

      expect((routeTrees as any).trees[0].children[0].children[0].parent).toBe(
        (routeTrees as any).trees[0].children[0],
      );
    });

    test('同上，合并路由时，都具有 children 的 路由合并应该 throw error。', () => {
      const routeTrees = getRouteTrees();
      const app1 = getAppInstance('name1');
      routeTrees.createTree([{ path: 'path1', slot: 'foo' }], app1);
      const app2 = getAppInstance('name2');
      routeTrees.createTree([{ path: 'path2', fill: 'foo', children: [{ path: 'path3' }] }], app2);
      const app3 = getAppInstance('name3');

      expect(() => {
        routeTrees.createTree([{ path: 'path2', fill: 'foo', children: [{ path: 'path4' }] }], app3);
      }).toThrowError('Can not Merge same route');
    });

    test('同上，合并路由时，任何一个 child 具有 slot 都应该 throw error。', () => {
      const routeTrees = getRouteTrees();
      const app1 = getAppInstance('name1');
      routeTrees.createTree([{ path: 'path1', slot: 'foo' }], app1);
      const app2 = getAppInstance('name2');
      routeTrees.createTree([{ path: 'path2', fill: 'foo' }], app2);
      const app3 = getAppInstance('name3');

      expect(() => {
        routeTrees.createTree([{ path: 'path2', fill: 'foo', slot: 'other' }], app3);
      }).toThrowError('Can not Merge same route');
    });

    test('声明两个具有相同插槽字段的路由节点，应当 throw error。', () => {
      const routeTrees = getRouteTrees();
      const app1 = getAppInstance('name1');
      routeTrees.createTree([{ path: 'path1', slot: 'foo' }], app1);
      const app2 = getAppInstance('name2');

      expect(() => {
        routeTrees.createTree([{ path: 'path2', slot: 'foo' }], app2);
      }).toThrowError('Duplicate slot key');
    });

    test('trees 应该可以被序列化。', () => {
      const routeTrees = getRouteTrees();
      const app = getAppInstance('name1');
      routeTrees.createTree([{ path: 'path1', children: [{ path: 'path2' }] }], app);

      expect(() => JSON.stringify((routeTrees as any).trees)).not.toThrowError();
    });
  });
});
