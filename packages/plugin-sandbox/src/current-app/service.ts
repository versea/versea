import { provide } from '@versea/core';

import { bindCurrentApp } from '../global-env';
import { ICurrentApp } from './interface';

export * from './interface';

interface ZoneWindow extends Window {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Zone: () => void;
}

const nextTick: (cb: () => void) => void =
  typeof (window as unknown as ZoneWindow).Zone === 'function'
    ? setTimeout
    : async (cb): Promise<void> => Promise.resolve().then(cb);

@provide(ICurrentApp)
export class CurrentApp implements ICurrentApp {
  protected _name: string | undefined = undefined;

  protected _taskPending = false;

  constructor() {
    bindCurrentApp(this);
  }

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
    if (!this._taskPending) {
      this._taskPending = true;
      nextTick(() => {
        this.setName();
        this._taskPending = false;
      });
    }
  }
}
