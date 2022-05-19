/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/naming-convention */
import { isBoundFunction as originIsBoundFunction } from './utils';

function isBoundFunction(value: Function & { __VERSEA_APP_IS_BOUND_FUNCTION__?: boolean }): boolean {
  if (typeof value.__VERSEA_APP_IS_BOUND_FUNCTION__ === 'boolean') return value.__VERSEA_APP_IS_BOUND_FUNCTION__;
  return (value.__VERSEA_APP_IS_BOUND_FUNCTION__ = originIsBoundFunction(value));
}

function isConstructor(value: Function & { __VERSEA_APP_IS_CONSTRUCTOR__?: boolean }): boolean {
  if (typeof value.__VERSEA_APP_IS_CONSTRUCTOR__ === 'boolean') return value.__VERSEA_APP_IS_CONSTRUCTOR__;

  const valueStr = value.toString();

  const result =
    ((value as FunctionConstructor).prototype?.constructor === value &&
      Object.getOwnPropertyNames(value.prototype).length > 1) ||
    /^function\s+[A-Z]/.test(valueStr) ||
    /^class\s+/.test(valueStr);

  return (value.__VERSEA_APP_IS_CONSTRUCTOR__ = result);
}

export function bindFunction<T extends Function & { __VERSEA_APP_BOUND_WINDOW_FUNCTION__?: T }>(
  global: Window,
  value: T,
): unknown {
  if (value.__VERSEA_APP_BOUND_WINDOW_FUNCTION__) return value.__VERSEA_APP_BOUND_WINDOW_FUNCTION__;

  if (!isConstructor(value) && !isBoundFunction(value)) {
    const bindRawWindowValue = value.bind(global) as T;

    for (const key in value) {
      bindRawWindowValue[key] = value[key];
    }

    // eslint-disable-next-line no-prototype-builtins
    if (value.hasOwnProperty('prototype')) {
      Object.defineProperty(bindRawWindowValue, 'prototype', {
        value: value.prototype as unknown,
        configurable: true,
        enumerable: false,
        writable: true,
      });
    }

    return (value.__VERSEA_APP_BOUND_WINDOW_FUNCTION__ = bindRawWindowValue);
  }

  return value;
}
