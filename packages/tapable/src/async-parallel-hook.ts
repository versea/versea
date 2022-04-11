import { BaseHook } from './base-hook';
import { HookContext } from './types';

export class AsyncParallelHook<T extends HookContext> extends BaseHook<T, Promise<void>> {
  public async call(context: T): Promise<void> {
    try {
      await Promise.all(this._taps.map(async (tap) => tap.fn(context)));
    } finally {
      this._removeOnce();
    }
  }
}
