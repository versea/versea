import { HookFactory } from './factory';
import { BaseHook } from './hook';
import { ArgsFunction, CompileOptions, TapType } from './types';

class AsyncSeriesHookFactory extends HookFactory {
  public content(options: CompileOptions): string {
    let code = `var count = ${options.taps.length};`;
    options.taps.forEach((tap, i) => {
      code += `
        var tap${i} = _taps[${i}];
        ${this.tapCall(options, i)}
        ${this.tapResult(options.type)}
      `;
    });
    code += 'count > 0 && _next0()';
    return code;
  }

  public tapCall(options: CompileOptions, i: number): string {
    const { args, type, taps } = options;
    const interceptorsTaps = options.interceptors.map(({ tap }) => tap).filter(Boolean);
    let argCode = '';
    args.forEach((arg, idx) => {
      argCode += idx === 0 ? `result || ${options.args[0] as string},` : `${arg as string},`;
    });
    argCode = argCode.slice(0, -1);
    if (taps[i].type === TapType.SYNC) {
      return `
        function _next${i}() {
          ${interceptorsTaps.map((_t, j) => `_interceptorsTaps[${j}](tap${j})`).join(';')}
          _x[${i}](${argCode});
          if (--count <= 0) {
            ${type === TapType.ASYNC ? `callback()` : `resolve()`};
            return;
          } else {
            _next${i + 1}();
          }
        }
      `;
    }
    if (taps[i].type === TapType.ASYNC) {
      return `
        function _next${i}() {
          ${interceptorsTaps.map((_t, j) => `_interceptorsTaps[${j}](tap${j})`).join(';')}
          function _cb() {
            if (--count <= 0) {
              ${type === TapType.ASYNC ? `callback()` : `resolve()`};
              return;
            } else {
              _next${i + 1}();
            }
          };
          _x[${i}](${argCode ? `${argCode}, _cb` : '_cb'});
        }
      `;
    }
    return `
      function _next${i}() {
        ${interceptorsTaps.map((_t, j) => `_interceptorsTaps[${j}](tap${j})`).join(';')}
        _p = _x[${i}](${argCode ? `${argCode}, _cb` : '_cb'});
        if (!_p || !_p.then) {
          throw new Error('TapPromise回调为返回promise');
        }
        _p.then((res) => {
          if (--count <= 0) {
            ${type === TapType.ASYNC ? `callback()` : `resolve()`};
            return;
          } else {
            _next${i + 1}();
          }
        })
      }
    `;
  }

  public callbackResult = (): string => '';

  public promiseResult = (): string => '';
}

const factory = new AsyncSeriesHookFactory();

/** 异步串行，不关心参数传递 */
export class AsyncSeriesHook extends BaseHook {
  public compile(options: CompileOptions): ArgsFunction {
    factory.setup(this, options);
    return factory.create(options);
  }

  public _call(): void {
    throw new Error('AsyncSeriesHook 不能使用call方法');
  }
}
