import { HookFactory } from './factory';
import { BaseHook } from './hook';
import { ArgsFunction, CompileOptions, TapType } from './types';

const syncFactory = new HookFactory();

export class SyncHook extends BaseHook {
  public compile(options: CompileOptions): ArgsFunction {
    syncFactory.setup(this, options);
    return syncFactory.create(options);
  }

  public tapAsync = (): void => {
    throw new Error('SyncHook不支持tapAsync');
  };

  public tapPromise = (): void => {
    throw new Error('SyncHook不支持tapPromise');
  };
}

class SyncBailHookFactory extends HookFactory {
  public callbackResult(type?: TapType): string {
    if (type === TapType.SYNC) return '';
    return 'callback(null, result)';
  }

  public tapResult(type?: TapType): string {
    return `if (result !== undefined) {
      ${(type === TapType.PROMISE && 'resolve(result);') || ''}
      ${(type === TapType.ASYNC && 'callback(null, result);') || ''}
      return result;
    }`;
  }
}

const syncBailHookFactory = new SyncBailHookFactory();
export class SyncBailHook extends BaseHook {
  public compile(options: CompileOptions): ArgsFunction {
    syncBailHookFactory.setup(this, options);
    return syncBailHookFactory.create(options);
  }

  public tapAsync = (): void => {
    throw new Error('SyncHook不支持tapAsync');
  };

  public tapPromise = (): void => {
    throw new Error('SyncHook不支持tapPromise');
  };
}

class SyncWaterfallHookFactory extends HookFactory {
  public promiseResult(type?: TapType): string {
    console.log(type);
    return 'resolve(result)';
  }

  public tapCall(options: CompileOptions, i: number): string {
    const { args } = options;
    let code = '';
    args.forEach((arg, idx) => {
      if (idx === 0) {
        code += `result || ${options.args[0] as string},`;
      } else {
        code += arg;
      }
    });
    return ` result = _x[${i}](${code}) || result;`;
  }

  public callbackResult(type?: TapType): string {
    if (type === TapType.SYNC) return 'return result;';
    return 'callback(null, result);';
  }
}

const syncWaterfallHookFactory = new SyncWaterfallHookFactory();

/** 同步串行，上一个执行结果交给下一个作为参数 */
export class SyncWaterfallHook extends BaseHook {
  public compile(options: CompileOptions): ArgsFunction {
    syncWaterfallHookFactory.setup(this, options);
    return syncWaterfallHookFactory.create(options);
  }

  public tapAsync = (): void => {
    throw new Error('SyncHook不支持tapAsync');
  };

  public tapPromise = (): void => {
    throw new Error('SyncHook不支持tapPromise');
  };
}
