import { provide } from '@versea/core';

import { ICurrentApp } from './interface';

export * from './interface';

const nextTick: (cb: () => void) => void =
  // eslint-disable-next-line @typescript-eslint/naming-convention
  typeof (window as unknown as Window & { Zone: () => void }).Zone === 'function'
    ? setTimeout
    : async (cb): Promise<void> => Promise.resolve().then(cb);

@provide(ICurrentApp)
export class CurrentApp implements ICurrentApp {
  protected _name: string | undefined = undefined;

  /** 是否已经存在异步任务 */
  protected _isPending = false;

  public getName(): string | undefined {
    return this._name;
  }

  public setName(name?: string): void {
    this._name = name;
  }

  public throttleDeferForSetAppName(name: string): void {
    if (!this._name || this._name !== name) {
      this.setName(name);
    }
    if (!this._isPending) {
      this._isPending = true;
      nextTick(() => {
        this.setName();
        this._isPending = false;
      });
    }
  }
}
