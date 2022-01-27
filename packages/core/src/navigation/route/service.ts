/* eslint-disable @typescript-eslint/no-explicit-any */
import { ExtensibleEntity, VerseaError } from '@versea/shared';

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
    return this.flatten().filter((route) => Boolean(route.slot));
  }

  public flatten(): IRoute[] {
    const result: IRoute[] = [];
    traverse<IRoute>(this, (node) => {
      result.push(node);
    });
    return result;
  }

  public merge(route: IRoute): void {
    if (this.path !== route.path) return;

    if (process.env.NODE_ENV !== 'production') {
      console.warn(`Merge same path route "${route.path}".`);
    }

    this.validSameRoute(route);

    this.apps = [...this.apps, ...route.apps];
    this.meta = { ...this.meta, ...route.meta };

    if (this.children.length === 0) {
      this.children = route.children;
      this.children.forEach((child) => {
        child.parent = this;
      });
    }
  }

  public appendChild(route: IRoute): void {
    const sameChild = this.children.find((child) => child.path === route.path);
    if (sameChild) {
      sameChild.merge(route);
      return;
    }

    route.parent = this;

    if (this.children.length === 0) {
      this.children.push(route);
      return;
    }

    const wildChildIndex = this.children.findIndex((child) => ['.*', '(.*)'].includes(child.path));
    if (wildChildIndex < 0) {
      this.children.push(route);
      return;
    }

    this.children.splice(wildChildIndex, 0, route);
  }

  protected validSameRoute(route: IRoute): void {
    if (this.children.length > 0 && route.children.length > 0) {
      throw new VerseaError('Can not Merge same route with children.');
    }

    if (this.slot || route.slot) {
      throw new VerseaError('Can not Merge same route with slot.');
    }

    if (this.fill || route.fill) {
      throw new VerseaError('Can not Merge same route with fill.');
    }
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
