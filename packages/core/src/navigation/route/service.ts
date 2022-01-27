/* eslint-disable @typescript-eslint/no-explicit-any */
import { ExtensibleEntity } from '@versea/shared';

import { IApp } from '../../application/app/service';
import { provide } from '../../provider';
import { traverse } from '../../utils';
import { IRoute, IRouteKey, RouteOptions } from './interface';

export * from './interface';

@provide(IRouteKey, 'Constructor')
export class Route extends ExtensibleEntity implements IRoute {
  public path: string;

  /** 配置的路由对应的应用 */
  public apps: IApp[];

  public parent: IRoute | null;

  /** route 额外参数 */
  public meta?: Record<string, any>;

  public children: IRoute[];

  /** 该 route 的 children 允许其他的应用的路由插入 */
  public slot?: string;

  /** 该 route 的整个内容需要插入其他的应用的路由的 children */
  public fill?: string;

  constructor(options: RouteOptions, app: IApp, parent: IRoute | null = null) {
    super(options);
    this.path = options.path;
    this.apps = [app];
    this.meta = options.meta ?? {};
    this.parent = parent;
    this.slot = options.slot;
    this.fill = options.fill;
    this.children = options.children
      ? options.children.map((child) => new (this.constructor as typeof Route)(child, app, this) as IRoute)
      : [];
  }

  public get slotRoutes(): IRoute[] {
    return this.flatten().filter((route) => Boolean(route.fill));
  }

  public flatten(): IRoute[] {
    const result: IRoute[] = [];
    traverse<IRoute>(this, (node) => {
      result.push(node);
    });
    return result;
  }

  protected toJSON(): Record<string, any> {
    const props = Object.keys(this);
    return props
      .filter((key) => !['parent'].includes(key))
      .reduce<Record<string, any>>((prev, key: keyof this) => {
        // 序列化时，apps 只需要返回 app 的名称
        if (key === 'apps') {
          prev.apps = this.apps.map((app) => app.name);
        }
        prev[key as string] = this[key];
        return prev;
      }, {});
  }
}
