// TODO: 重构这里，逻辑迁移到 route 或 router
import { pathToRegexp, TokensToRegexpOptions, ParseOptions, Key } from 'path-to-regexp';

import { provide } from '../../provider';
import { IRouteMatcher, IRouteMatcherKey } from './interface';

export * from './interface';

type PathToRegexpOptions = ParseOptions & TokensToRegexpOptions;

@provide(IRouteMatcherKey)
export class RouteMatcher implements IRouteMatcher {
  public match(
    path: string,
    route: string,
    params?: Record<string, string>,
    options: PathToRegexpOptions = {},
  ): boolean {
    const keys: Key[] = [];
    const regex = this.compileRouteRegex(route, options, keys);
    const matchArray = path.match(regex);

    if (!matchArray) {
      return false;
    }

    if (params) {
      for (let i = 1, len = matchArray.length; i < len; ++i) {
        const key = keys[i - 1];
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (key) {
          // 匹配 wildcard(.*) 时，使用 pathMatch 表示
          params[key.name || 'pathMatch'] =
            typeof matchArray[i] === 'string' ? decodeURIComponent(matchArray[i]) : matchArray[i];
        }
      }
    }

    return true;
  }

  protected compileRouteRegex(route: string, options: PathToRegexpOptions, keys: Key[]): RegExp {
    const regex = pathToRegexp(route, keys, {
      end: false,
      ...options,
    });
    if (process.env.NODE_ENV !== 'production') {
      const keysMapping = Object.create(null) as Record<string, boolean>;
      keys.forEach((key) => {
        if (keysMapping[key.name]) {
          console.warn(`Duplicate param keys in route with path: "${route}"`);
        }
        keysMapping[key.name] = true;
      });
    }
    return regex;
  }
}
