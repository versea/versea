/**
 * @class BaseError
 * BaseError 继承 Error 这种原生 class，可能导致丢失原型链，这个类是用于解决丢失原型链的问题，参考 https://zhuanlan.zhihu.com/p/113019880
 */
export class BaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, new.target);
    }
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class VerseaError extends BaseError {}

export class VerseaCanceledError extends BaseError {}
