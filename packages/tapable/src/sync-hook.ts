import { BaseHook } from './base-hook';
import { HookContext } from './types';

export class SyncHook<T extends HookContext> extends BaseHook<T, void> {
  public call(context: T): void {
    for (const tap of this._getTaps()) {
      if (context.ignoreTap?.length && context.ignoreTap.includes(tap.name)) {
        continue;
      }

      try {
        tap.fn(context);
      } catch (error) {
        context.bail = false;
        context.ignoreTap = undefined;
        throw error;
      }

      if (context.bail) {
        break;
      }
    }

    context.bail = false;
    context.ignoreTap = undefined;
  }
}
