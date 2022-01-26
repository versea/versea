/* eslint-disable @typescript-eslint/no-explicit-any */
import { ExtensibleEntity } from '@versea/shared';

import { IApp } from '../../application/app/service';
import { provide } from '../../provider';
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

  public children: IRoute[] | null;

  constructor(options: RouteOptions, app: IApp, parent: IRoute | null = null) {
    super(options);
    this.path = options.path;
    this.apps = [app];
    this.meta = options.meta ?? {};
    this.parent = parent;
    this.children = options.children
      ? options.children.map((child) => new (this.constructor as typeof Route)(child, app, this) as IRoute)
      : null;
  }
}
