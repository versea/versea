/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ArgsFunction,
  ArgsPromiseFunction,
  ArgsVoidFunction,
  CompileOptions,
  Interceptor,
  Tap,
  TapType,
} from './types';

class BaseHook {
  public interceptors: Interceptor[];

  public taps: Tap[];

  public call: ArgsFunction;

  public callAsync: ArgsVoidFunction;

  public promise: ArgsPromiseFunction;

  public _x: ((...args: string[]) => void)[] = [];

  private readonly _args: string[];

  constructor(args: string[] = []) {
    this.taps = [];
    this._args = args;
    this.interceptors = [];
    this.call = this._call;
    this.callAsync = this._callAsync;
    this.promise = this._promise;
  }

  public intercept(interceptor: Interceptor): void {
    this.interceptors.push({ ...interceptor });
    if (interceptor.register) {
      for (let i = 0; i < this.taps.length; i++) {
        this.taps[i] = interceptor.register(this.taps[i]);
      }
    }
  }

  /** 实例没实现compile时会走到这里 */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public compile(options: CompileOptions): ArgsFunction {
    throw new Error(`Method not implemented. Options: ${JSON.stringify(options)}`);
  }

  public tap = (options: Tap | string, fn: (...args: string[]) => void): void => {
    this._tap(TapType.SYNC, options, fn);
  };

  public tapAsync = (options: Tap | string, fn: (...args: any[]) => void): void => {
    this._tap(TapType.ASYNC, options, fn);
  };

  public tapPromise = (options: Tap | string, fn: (...args: string[]) => void): void => {
    this._tap(TapType.PROMISE, options, fn);
  };

  public _call(...args: any[]): any {
    this.call = this._createCall(TapType.SYNC);
    return this.call(...args);
  }

  private _tap(type: TapType, options: Tap | string, fn: (...args: string[]) => void): void {
    if (typeof options === 'string') {
      options = {
        name: options,
      };
    }
    if (!options.name || typeof options !== 'object') {
      throw new Error('option参数错误');
    }
    options = { type, fn, ...options };
    options = this._runRegister(options);
    this._insert(options);
  }

  private _runRegister(options: Tap): Tap {
    for (const interceptor of this.interceptors) {
      if (interceptor.register) {
        options = interceptor.register(options);
      }
    }
    return options;
  }

  private _insert(options: Tap): void {
    this._reset();
    const stage = options.stage ?? 0;
    let before: Set<string> = new Set();
    if (typeof options.before === 'string') {
      before = new Set([options.before]);
    } else if (Array.isArray(options.before)) {
      before = new Set(options.before);
    }

    let i = this.taps.length;
    /** 插入排序，stage和before字段判断是否向前 */
    while (i > 0) {
      const tap = this.taps[i - 1];
      this.taps[i] = tap;
      const tState = tap.stage ?? 0;
      if (stage < tState) {
        i--;
        continue;
      }
      if (before.size) {
        before.delete(tap.name);
        i--;
        continue;
      }
      break;
    }
    this.taps[i] = options;
  }

  private _reset(): void {
    this.call = this._call;
    this.promise = this._promise;
    this.callAsync = this._callAsync;
  }

  private _callAsync(...args: any[]): void {
    this.callAsync = this._createCall(TapType.ASYNC);
    this.callAsync(...args);
  }

  private async _promise(...args: any[]): Promise<any> {
    this.promise = this._createCall(TapType.PROMISE);
    return this.promise(...args);
  }

  private _createCall(type: TapType): ArgsFunction {
    return this.compile({
      taps: this.taps,
      interceptors: this.interceptors,
      args: this._args,
      type,
    });
  }
}

Object.setPrototypeOf(BaseHook.prototype, null);

export { BaseHook };
