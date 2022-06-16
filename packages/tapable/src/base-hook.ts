import { VerseaError } from '@versea/shared';

import { Tap, TapOptions, HookContext } from './types';

const DefaultHookPriority = 0;

export class BaseHook<T extends HookContext, K extends Promise<void> | void> {
  protected _taps: Tap<T, K>[] = [];

  public tap(name: string, fn: (context: T) => K, options: TapOptions = {}): void {
    const sameNameTap = this._taps.find((item) => item.name === name);
    if (sameNameTap) {
      if (!options.replace) {
        throw new VerseaError(`Duplicate tap name "${name}".`);
      }

      sameNameTap.fn = this._wrapperCallback(fn, options);
      return;
    }

    const priority = options.priority ?? DefaultHookPriority;
    const tap = {
      name,
      fn: this._wrapperCallback(fn, options),
      priority,
    };

    if (this._taps.length == 0) {
      this._taps.push(tap);
      return;
    }

    if (options.before) {
      this._insert(tap, options.before, 'before');
      return;
    }

    if (options.after) {
      this._insert(tap, options.after, 'after');
      return;
    }

    for (let i = this._taps.length - 1; i >= 0; i--) {
      const currentTap = this._taps[i];
      if (currentTap.priority <= priority) {
        this._taps.splice(i + 1, 0, tap);
        return;
      }

      if (i === 0) {
        this._taps.unshift(tap);
      }
    }
  }

  public remove(name: string): void {
    const index = this._taps.findIndex((item) => item.name === name);
    if (index >= 0) {
      this._taps.splice(index, 1);
    }
  }

  protected _getTaps(): Tap<T, K>[] {
    return [...this._taps];
  }

  protected _insert(tap: Tap<T, K>, name: string, type: 'after' | 'before'): void {
    const index = this._taps.findIndex((item) => item.name === name);
    if (index < 0) {
      throw new VerseaError(`Insert ${type} failed with tap name "${name}".`);
    }

    tap.priority = this._taps[index].priority;
    const appendIndex = type === 'before' ? index : index + 1;
    this._taps.splice(appendIndex, 0, tap);
  }

  protected _wrapperCallback(fn: (context: T) => K, options: TapOptions): (context: T) => K {
    if (!options.once) {
      return fn;
    }

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    const wrapperOnceFunction = function wrapperOnceFunction(context: T): K {
      try {
        return fn(context);
      } finally {
        const index = self._taps.findIndex((tap) => tap.fn === wrapperOnceFunction);
        if (index >= 0) {
          self._taps.splice(index, 1);
        }
      }
    };

    return wrapperOnceFunction;
  }
}
