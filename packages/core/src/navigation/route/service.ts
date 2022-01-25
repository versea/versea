/* eslint-disable @typescript-eslint/no-explicit-any */
import { ExtensibleEntity } from '@versea/shared';

import { IApp } from '../../application/app/service';
import { provide } from '../../provider';
import { IRoute, IRouteKey, RouteOptions } from './interface';

export * from './interface';

@provide(IRouteKey, 'Constructor')
export class Route extends ExtensibleEntity implements IRoute {
  public path: string;

  /** 子应用的名称 */
  public apps: IApp[];

  /** route 额外参数 */
  public meta?: Record<string, any>;

  /** 子路由 */
  public children: IRoute[] | null;

  constructor(options: RouteOptions, app: IApp) {
    super(options);
    this.path = options.path;
    this.apps = [app];
    this.meta = options.meta;
    this.children = options.children
      ? options.children.map((child) => new (this.constructor as typeof Route)(child, app) as IRoute)
      : null;
  }
}
