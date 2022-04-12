import { VerseaError } from '@versea/shared';

import { Tap, TapOptions, HookContext } from './types';

const DefaultHookPriority = 0;

export class BaseHook<T extends HookContext, K extends Promise<void> | void> {
  protected _taps: Tap<T, K>[] = [];

  public tap(name: string, fn: (context: T) => K, options: TapOptions = {}): void {
    const sameTap = this._taps.find((item) => item.name === name);
    if (sameTap) {
      if (!options.replace) {
        throw new VerseaError(`Duplicate tap name: "${name}".`);
      }

      sameTap.fn = fn;
      sameTap.once = options.once;
      return;
    }

    const priority = options.priority ?? DefaultHookPriority;
    const newTap = {
      name,
      fn,
      priority,
      once: options.once,
    };
    for (let i = this._taps.length - 1; i >= 0; i--) {
      const currentTap = this._taps[i];
      if (currentTap.priority <= priority) {
        this._taps.splice(i + 1, 0, newTap);
        return;
      }

      if (i === 0) {
        this._taps.unshift(newTap);
      }
    }
  }

  public remove(name: string): void {
    const index = this._taps.findIndex((item) => item.name === name);
    if (index >= 0) {
      this._taps.splice(index, 1);
    }
  }

  protected _removeOnce(index: number = this._taps.length - 1): void {
    for (let i = index; i >= 0; i--) {
      const tap = this._taps[i];
      if (tap.once) {
        this._taps.splice(i, 1);
      }
    }
  }
}
