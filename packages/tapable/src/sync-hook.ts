import { BaseHook } from './base-hook';
import { HookContext } from './types';

export class SyncHook<T extends HookContext> extends BaseHook<T, void> {
  public call(context: T): void {
    let breakIndex = this._taps.length - 1;
    const excludedOnceTapNames = [];

    for (let i = 0; i < this._taps.length; i++) {
      const tap = this._taps[i];
      if (context.ignoreTap?.length) {
        if (context.ignoreTap.includes(tap.name)) {
          excludedOnceTapNames.push(tap.name);
          continue;
        }
      }

      try {
        tap.fn(context);
      } catch (error) {
        context.bail = false;
        context.ignoreTap = undefined;
        this._removeOnce(i, excludedOnceTapNames);
        throw error;
      }

      if (context.bail) {
        breakIndex = i;
        break;
      }
    }

    context.bail = false;
    context.ignoreTap = undefined;
    this._removeOnce(breakIndex, excludedOnceTapNames);
  }
}
