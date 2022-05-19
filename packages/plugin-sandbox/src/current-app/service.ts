import { provide } from '@versea/core';

import { bindCurrentApp } from '../global-env';
import { ICurrentApp, ICurrentAppKey } from './interface';

export * from './interface';

interface ZoneWindow extends Window {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Zone: () => void;
}

const nextTick: (cb: () => void) => void =
  typeof (window as unknown as ZoneWindow).Zone === 'function'
    ? setTimeout
    : async (cb): Promise<void> => Promise.resolve().then(cb);

@provide(ICurrentAppKey)
export class CurrentApp implements ICurrentApp {
  protected _currentAppName: string | undefined = undefined;

  protected _taskPending = false;

  constructor() {
    bindCurrentApp(this);
  }

  public getCurrentAppName(): string | undefined {
    return this._currentAppName;
  }

  public setCurrentAppName(name?: string): void {
    this._currentAppName = name;
  }

  public throttleDeferForSetAppName(name: string): void {
    if (!this._currentAppName || this._currentAppName !== name) {
      this.setCurrentAppName(name);
    }
    if (!this._taskPending) {
      this._taskPending = true;
      nextTick(() => {
        this.setCurrentAppName();
        this._taskPending = false;
      });
    }
  }
}
