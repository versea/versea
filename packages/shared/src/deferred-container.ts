/* eslint-disable @typescript-eslint/ban-types */
import { Deferred } from './promise-helper';

export interface DeferredContainerOptions {
  handleValue?: (value: unknown) => Promise<void>;
}

export class DeferredContainer<T extends {}> {
  protected readonly _deferredMap = {} as { [key in keyof T]: Deferred<T[key]> };

  protected readonly _handleValue?: (value: unknown) => Promise<void>;

  constructor(options: DeferredContainerOptions = {}) {
    this._handleValue = options.handleValue;
  }

  /** 是否已经有触发或者监听 */
  public has(name: keyof T): boolean {
    return name in this._deferredMap;
  }

  /** 删除保存的 Promise 保存对象 */
  public delete(name: keyof T): void {
    if (this._deferredMap[name]) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete this._deferredMap[name];
    }
  }

  public keys(): (keyof T)[] {
    return Object.keys(this._deferredMap) as (keyof T)[];
  }

  public async wait<K extends keyof T>(name: K, value: unknown): Promise<T[K]> {
    if (this._handleValue) {
      await this._handleValue(value);
    }

    return this._defer<K>(name).promise;
  }

  public resolve<K extends keyof T>(
    name: K,
    ...args: T[K] extends undefined ? [] : undefined extends T[K] ? [value?: T[K]] : [value: T[K]]
  ): void {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this._defer<K>(name).resolve(args[0]!);
  }

  public reject<K extends keyof T>(name: K, reason?: unknown): void {
    this._defer<K>(name).reject(reason);
  }

  protected _defer<K extends keyof T>(name: K): Deferred<T[K]> {
    if (!this._deferredMap[name]) {
      this._deferredMap[name] = new Deferred<T[K]>();
    }

    return this._deferredMap[name];
  }
}
