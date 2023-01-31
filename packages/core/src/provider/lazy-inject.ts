import 'reflect-metadata';
import { interfaces } from 'inversify';

import { VERSEA_METADATA_LAZY_INJECT_KEY } from '../constants';

/**
 * 懒注入依赖
 * @description 仅仅使用的时候才会实例化依赖，一般用于解决循环依赖的问题
 */
export function lazyInject(serviceIdentifier: interfaces.ServiceIdentifier) {
  return function (target: unknown, propertyKey: string): void {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const metadata: Record<string, interfaces.ServiceIdentifier> =
      Reflect.getMetadata(VERSEA_METADATA_LAZY_INJECT_KEY, target as object) || {};
    metadata[propertyKey] = serviceIdentifier;
    Reflect.defineMetadata(VERSEA_METADATA_LAZY_INJECT_KEY, metadata, target as object);
  };
}
