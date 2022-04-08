import { HookFactory } from './factory';
import { BaseHook } from './hook';
import { ArgsFunction, CompileOptions, TapType } from './types';

class AsyncSeriesBailHookFactory extends HookFactory {
  public content(options: CompileOptions): string {
    let code = `var count = ${options.taps.length}`;
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
    const interceptorsTaps = options.interceptors.map((_i) => _i.tap).filter(Boolean);
    let argCode = '';
    args.forEach((arg, idx) => {
      if (idx === 0) {
        argCode += `result || ${options.args[0] as string},`;
      } else {
        argCode += `${arg as string},`;
      }
    });
    argCode = argCode.slice(0, -1);
    if (taps[i].type === TapType.SYNC) {
      return `
        function _next${i}(){
          ${interceptorsTaps.map((_t, j) => `_interceptorsTaps[${j}](tap${j})`).join(';')}
          var result${i} = _x[${i}](${argCode});
          if (result${i} !== undefined || --count <= 0) {
            ${type === TapType.ASYNC ? `callback(result${i})` : `resolve(result${i})`};
            return;
          }else{
            _next${i + 1}();
          }
        }`;
    }
    if (taps[i].type === TapType.ASYNC) {
      return `
      function _next${i}(){
        ${interceptorsTaps.map((_t, j) => `_interceptorsTaps[${j}](tap${j})`).join(';')}
        function _cb(res){
          if (res !== undefined || --count <= 0) {
            ${type === TapType.ASYNC ? `callback(res)` : `resolve(res)`};
            return;
          }else{
            _next${i + 1}();
          }
        };
        var result${i} = _x[${i}](${argCode ? `${argCode}, _cb` : '_cb'});
      }`;
    }
    return `
    function _next${i}(){
      ${interceptorsTaps.map((_t, j) => `_interceptorsTaps[${j}](tap${j})`).join(';')}
      _p = _x[${i}](${argCode ? `${argCode}, _cb` : '_cb'});
      if (!_p || !_p.then) {
        throw new Error('TapPromise回调未返回promsis');
      }
      _p.then((res) => {
        if (result${i} !== undefined || --count <= 0) {
          ${type === TapType.ASYNC ? `callback(result${i})` : `resolve(result${i})`};
          return;
        } else {
          _next${i + 1}();
        }
      })
    }`;
  }

  public callbackResult(type?: TapType): string {
    switch (type) {
      case TapType.ASYNC: {
        return `
        if (count === 0) {
          callback(result);
        }`;
      }
      case TapType.PROMISE:
      default: {
        return `
        if (count === 0) {
          resolve(result);
        }
        `;
      }
    }
  }

  public promiseResult(type?: TapType): string {
    switch (type) {
      case TapType.ASYNC: {
        return `
        if (count === 0){
          callback(result);
        }`;
      }
      case TapType.PROMISE:
      default: {
        return `
        if (count === 0){
          resolve(result);
        }`;
      }
    }
  }
}

const factory = new AsyncSeriesBailHookFactory();

/** 异步串行，返回值不为undefined时停止后续返回 */
export class AsyncSeriesBailHook extends BaseHook {
  public compile(options: CompileOptions): ArgsFunction {
    factory.setup(this, options);
    return factory.create(options);
  }

  public _call(): void {
    throw new Error('AsyncSeriesBailHook不能使用call方法');
  }
}
