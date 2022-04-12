import { BaseHook } from './base-hook';
import { HookContext } from './types';

export class SyncHook<T extends HookContext> extends BaseHook<T, void> {
  public call(context: T): void {
    let breakIndex = this._taps.length - 1;

    for (let i = 0; i < this._taps.length; i++) {
      try {
        this._taps[i].fn(context);
      } catch (error) {
        context.bail = false;
        this._removeOnce(i);
        throw error;
      }

      if (context.bail) {
        breakIndex = i;
        break;
      }
    }

    context.bail = false;
    this._removeOnce(breakIndex);
  }
}
