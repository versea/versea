import { BaseHook } from './base-hook';
import { HookContext } from './types';

export class AsyncSeriesHook<T extends HookContext> extends BaseHook<T, Promise<void>> {
  public async call(context: T): Promise<void> {
    let breakIndex = this._taps.length - 1;

    for (let i = 0; i < this._taps.length; i++) {
      try {
        await this._taps[i].fn(context);
      } catch (error) {
        this._removeOnce(i);
        throw error;
      }

      if (context.bail) {
        breakIndex = i;
        break;
      }
    }

    this._removeOnce(breakIndex);
  }
}
