/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { VerseaError } from './error';

export interface ExtensiblePropDescription {
  required?: boolean;
  default?: any;
  validator?: (value: any) => boolean;
}

function getDefaultValue(key: string, defaultValue: any): any {
  if (process.env.NODE_ENV !== 'production' && typeof defaultValue === 'object' && defaultValue !== null) {
    console.warn(
      `Invalid default value for prop "${key}": Props with type Object/Array must use a factory function to return the default value.`,
    );
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  return typeof defaultValue === 'function' ? defaultValue() : defaultValue;
}

/**
 * 获取所有的派生类
 * @param instance 派生类的实例
 * @param baseClass 基础类
 */
function findAllDerivedClass(instance: any, baseClass: any, currentValue: any[] = []): any[] {
  const targetConstructor = instance.constructor;

  // 只寻找派生类，不包含这个基类
  if (targetConstructor === baseClass) {
    return currentValue;
  }

  const result: any[] = [...currentValue];
  if (targetConstructor && !currentValue.includes(targetConstructor)) {
    result.push(targetConstructor);
  }

  if (!instance.__proto__) {
    return result;
  }

  return findAllDerivedClass(instance.__proto__, baseClass, result);
}

export class ExtensibleEntity {
  [key: string]: any;

  // eslint-disable-next-line @typescript-eslint/naming-convention
  private static __extensiblePropDescriptions__: Record<string, ExtensiblePropDescription>;

  constructor(options: Record<string, any> = {}) {
    const constructors = findAllDerivedClass(this, ExtensibleEntity);
    // 从子类开始遍历，子类 -> 孙子类 -> ...
    constructors.reverse().forEach((ctor) => {
      const descriptions: Record<string, ExtensiblePropDescription> = ctor.__extensiblePropDescriptions__;
      Object.keys(descriptions).forEach((key: string) => {
        this._setEntityProp(key, options[key], descriptions[key]);
      });
    });
  }

  /**
   * 在实体类上新增一个字段
   */
  public static defineProp(key: string, description: ExtensiblePropDescription = {}): void {
    // eslint-disable-next-line no-prototype-builtins
    if (!this.hasOwnProperty('__extensiblePropDescriptions__')) {
      this.__extensiblePropDescriptions__ = {};
    }

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (this.__extensiblePropDescriptions__[key]) {
      throw new VerseaError(`Duplicate prop: ${key}`);
    }

    this.__extensiblePropDescriptions__[key] = description;
  }

  private _setEntityProp(key: string, value: any, description: ExtensiblePropDescription): void {
    if (value === undefined) {
      value = getDefaultValue(key, description.default);
    }

    if (description.required && value === undefined) {
      throw new VerseaError(`Missing required prop: "${key}"`);
    }

    if (description.validator && !description.validator(value)) {
      throw new VerseaError(`Invalid prop: custom validator check failed for prop "${key}"`);
    }

    this[key] = value;
  }
}
