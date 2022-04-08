/* eslint-disable @typescript-eslint/no-implied-eval */
/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { BaseHook } from './hook';
import { ArgsFunction, CompileOptions, TapType } from './types';

class HookFactory {
  /** 创建执行函数 */
  public create(options: CompileOptions): ArgsFunction {
    // eslint-disable-next-line @typescript-eslint/init-declarations
    let fn: ArgsFunction;
    let code = this.header();
    switch (options.type) {
      case TapType.PROMISE:
        code += `
        return new Promise((resolve, reject) => {
          ${this.contentWithInterceptors(options)}
          ${this.promiseResult(options.type)}
        })
        `;
        fn = new Function(this.args(options), code) as ArgsFunction;
        break;
      case TapType.ASYNC: {
        code += this.contentWithInterceptors(options);
        code += this.callbackResult(options.type);
        fn = new Function(this.args(options, 'callback'), code) as ArgsFunction;
        break;
      }
      case TapType.SYNC:
      default: {
        code += this.contentWithInterceptors(options);
        code += this.callbackResult(options.type);
        fn = new Function(this.args(options), code) as ArgsFunction;
        break;
      }
    }
    return fn;
  }

  public args(options: CompileOptions, cb?: string): string {
    return options.args.concat(cb ?? []).join(',');
  }

  /** Hook存储fns */
  public setup(instance: BaseHook, options: CompileOptions): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    instance._x = options.taps.map(({ fn }) => fn) as ((...args: any[]) => void)[];
  }

  /** 头部、定义变量名 */
  public header(): string {
    return `
      const _x = this._x;
      const _taps = this.taps;
      const _interceptors = this.interceptors;
      const _interceptorsTaps = _interceptors.map(({tap}) => tap).filter(Boolean);
    `;
  }

  /** taps执行 */
  public content(options: CompileOptions): string {
    const interceptorsTaps = options.interceptors.map(({ tap }) => tap).filter(Boolean);
    let code = '';
    options.taps.forEach((tap, i) => {
      code += `
      var tap${i} = _taps[${i}];
      ${interceptorsTaps.map((_t, j) => `_interceptorsTaps[${j}](tap${j})`).join(';')}
      ${this.tapCall(options, i)}
        ${this.tapResult(options.type)}
      `;
    });
    return code;
  }

  /** inteceptor中的call函数 */
  public callHook(options: CompileOptions): string {
    let idx = 0;
    let code = '';
    options.interceptors.forEach((interceptor) => {
      if (interceptor.call) {
        code += `_interceptors[${idx}].call(${options.args.join(',')});`;
        idx++;
      }
    });
    return code;
  }

  /** tap执行前执行 */
  public tapsBefore(options: CompileOptions): string {
    return `let args = ${options.args[0] as string}
    let result = args;`;
  }

  /** tap执行函数 */
  public tapCall(options: CompileOptions, i: number): string {
    const { args } = options;
    let argCode = '';
    args.forEach((arg, idx) => {
      if (idx === 0) {
        argCode += `result || ${options.args[0] as string},`;
      } else {
        argCode += `${arg as string},`;
      }
    });
    argCode = argCode.slice(0, -1);
    return ` result = _x[${i}](${argCode});`;
  }

  /** 执行完tap的结果处理逻辑 */
  public tapResult(type?: TapType): string {
    return '';
  }

  /** 执行完taps返回 */
  public promiseResult(type?: TapType): string {
    return 'resolve()';
  }

  public callbackResult(type?: TapType): string {
    if (type === TapType.SYNC) return '';
    return 'callback()';
  }

  /** 执行函数及拦截器函数 */
  public contentWithInterceptors(options: CompileOptions): string {
    return `
      ${this.callHook(options)}
      ${this.tapsBefore(options)}
      ${this.content(options)}
    `;
  }
}

export { HookFactory };
