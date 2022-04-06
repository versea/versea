import { ExtensibleEntity, VerseaError } from '@versea/shared';
import { pathToRegexp, Key } from 'path-to-regexp';

import { IApp } from '../../application/app/service';
import { provide } from '../../provider';
import { traverse } from '../../utils';
import { IRoute, IRouteKey, MatchedRoute, RouteConfig, PathToRegexpOptions, ToMatchedRouteOptions } from './interface';

export * from './interface';

@provide(IRouteKey, 'Constructor')
export class Route extends ExtensibleEntity implements IRoute {
  public path: string;

  public isFragment: boolean;

  public apps: IApp[];

  public parent: IRoute | null;

  public meta: Record<string, unknown>;

  public children: IRoute[];

  public slot?: string;

  public fill?: string;

  public pathToRegexpOptions: PathToRegexpOptions;

  constructor(config: RouteConfig, app: IApp, parent: IRoute | null = null) {
    super(config);

    // 检查输入参数
    this._validRouteConfig(config);

    this.path = `/${config.path.replace(/(^\/*)|(\/*$)/g, '')}`;
    this.apps = [app];
    this.parent = parent;
    this.isFragment = config.isFragment ?? false;
    this.meta = config.meta ?? {};
    this.slot = config.slot;
    this.fill = config.fill;
    this.pathToRegexpOptions = config.pathToRegexpOptions ?? {};
    this.children = config.children
      ? config.children.map((child) => new (this.constructor as typeof Route)(child, app, this) as IRoute)
      : [];
  }

  public get slotRoutes(): IRoute[] {
    return this.flatten().filter((route) => Boolean(route.slot));
  }

  public get fullPath(): string {
    return this.parent ? `${this.parent.fullPath}${this.path}`.replace(/(\/+)/g, '/') : this.path;
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

    if (!route.isFragment) {
      if (!this.isFragment) {
        throw new VerseaError('Can not Merge route(same path) without fragment.');
      }

      // 使用主路由合并碎片路由
      route.merge(this);
      return;
    }

    if (process.env.NODE_ENV !== 'production') {
      console.warn(`Merge route with same path  "${route.path}".`);
    }

    // 合并扩展属性
    Object.keys(this._extensiblePropDescriptions).forEach((key: string) => {
      if (this._extensiblePropDescriptions[key].onMerge) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion
        this[key] = this._extensiblePropDescriptions[key].onMerge!(this[key], (route as Record<string, any>)[key]);
      }
    });

    // 主路由应用放在碎片应用之前
    this.apps = [...this.apps, ...route.apps];
    this.isFragment = this.isFragment && route.isFragment;

    // 合并之后可能导致 parent 和 children 都不正确，需要修改他们
    if (!this.parent && route.parent) {
      this.parent = route.parent;
      const index = this.parent.children.findIndex((child) => child === route);
      this.parent.children.splice(index, 1, this);
    }
  }

  public appendChild(route: IRoute): void {
    const samePathChild = this.children.find((child) => child.path === route.path);
    if (samePathChild) {
      samePathChild.merge(route);
      return;
    }

    route.parent = this;

    // 保证添加的子路由节点在 (.*) 的路由匹配节点之前
    const wildChildIndex = this.children.findIndex((child) => ['/(.*)'].includes(child.path));
    if (wildChildIndex < 0) {
      this.children.push(route);
      return;
    }
    this.children.splice(wildChildIndex, 0, route);
  }

  public compile(keys: Key[]): RegExp {
    return pathToRegexp(this.fullPath, keys, {
      end: false,
      ...this.pathToRegexpOptions,
    });
  }

  public toMatchedRoute(options: ToMatchedRouteOptions): MatchedRoute {
    if (this.isFragment) {
      throw new VerseaError(`Can not match route path "${this.fullPath}" with only fragment routes.`);
    }

    const extensibleObject: Record<string, unknown> = {};
    Object.keys(this._extensiblePropDescriptions).forEach((key) => {
      if (this._extensiblePropDescriptions[key].onClone) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion
        extensibleObject[key] = this._extensiblePropDescriptions[key].onClone!(this[key]);
      } else {
        extensibleObject[key] = this[key];
      }
    });

    return {
      ...extensibleObject,
      path: this.path,
      apps: this.apps,
      meta: { ...this.meta },
      fullPath: this.fullPath,
      params: options.params ?? {},
      query: options.query ?? {},
      getRoute: (): IRoute => this,
    };
  }

  protected _validRouteConfig(config: RouteConfig): void {
    if (config.isFragment) {
      ['meta', 'slot', 'pathToRegexpOptions', 'children'].forEach((key) => {
        if (config[key as keyof RouteConfig]) {
          throw new VerseaError(`FragmentRoute "${key}" option is not support.`);
        }
      });
    }

    if (config.isRootFragment) {
      ['slot', 'children'].forEach((key) => {
        if (config[key as keyof RouteConfig]) {
          throw new VerseaError(`RootFragmentRoute "${key}" option is not support.`);
        }
      });
    }
  }

  // eslint-disable-next-line @typescript-eslint/naming-convention
  protected toJSON(): Record<string, unknown> {
    const props = Object.keys(this);
    return props
      .filter((key) => !['parent'].includes(key))
      .reduce<Record<string, unknown>>((prev, key: keyof this) => {
        // 序列化只返回 app 的名称
        if (key === 'apps') {
          prev.apps = this.apps.map((app) => app.name);
        }
        prev[key as string] = this[key];
        return prev;
      }, {});
  }
}
