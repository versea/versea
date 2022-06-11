import { BaseHook } from './base-hook';
import { HookContext } from './types';

export class AsyncSeriesHook<T extends HookContext> extends BaseHook<T, Promise<void>> {
  public async call(context: T): Promise<void> {
    for (const tap of this._getTaps()) {
      if (context.ignoreTap?.length && context.ignoreTap.includes(tap.name)) {
        continue;
      }

      try {
        await tap.fn(context);
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
