/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { VerseaError } from './error';

/** 扩展属性的描述 */
export interface ExtensiblePropDescription {
  /** 扩展属性对应的 option 的 key */
  optionKey?: string;

  /** 是否必传字段 */
  required?: boolean;

  /** 默认值 */
  default?: unknown;

  /** 验证函数 */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  validator?: (value: unknown, options: Record<string, any>) => boolean;

  /** 格式化函数 */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  format?: (value: unknown, options: Record<string, any>) => unknown;

  onMerge?: (value: unknown, otherValue: unknown) => unknown;
  onClone?: (value: unknown) => unknown;
}

/**
 * 获取所有的派生类
 * @param instance 派生类的实例
 * @param baseClass 基础类
 */
function findAllDerivedClass(
  instance: ExtensibleEntity,
  baseClass: typeof ExtensibleEntity,
  currentValue: typeof ExtensibleEntity[] = [],
): typeof ExtensibleEntity[] {
  const targetConstructor = instance.constructor as typeof ExtensibleEntity;

  // 只寻找派生类，不包含这个基类本身
  if (targetConstructor === baseClass) {
    return currentValue;
  }

  const result: typeof ExtensibleEntity[] = [...currentValue];
  if (targetConstructor && !currentValue.includes(targetConstructor)) {
    result.push(targetConstructor);
  }

  /* istanbul ignore next */
  if (!instance.__proto__) {
    return result;
  }

  return findAllDerivedClass(instance.__proto__ as ExtensibleEntity, baseClass, result);
}

export class ExtensibleEntity {
  [key: string]: unknown;

  /** 类上可扩展的属性和该属性的描述 */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  private static __ExtensiblePropDescriptions__: Record<string, ExtensiblePropDescription> | undefined;

  /** 实例上所有可扩展的属性和该属性的描述 */
  protected _extensiblePropDescriptions: Record<string, ExtensiblePropDescription> = {};

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(options: Record<string, any> = {}) {
    const constructors = findAllDerivedClass(this, ExtensibleEntity);
    // 从子类开始遍历，子类 -> 孙子类 -> ...
    constructors.reverse().forEach((ctor) => {
      const descriptions: Record<string, ExtensiblePropDescription> | undefined = ctor.__ExtensiblePropDescriptions__;
      if (descriptions) {
        Object.keys(descriptions).forEach((key: string) => {
          this._extensiblePropDescriptions[key] = descriptions[key];
        });
      }
    });

    Object.keys(this._extensiblePropDescriptions).forEach((key: string) => {
      const description = this._extensiblePropDescriptions[key];
      this._setEntityProp(key, options[description.optionKey ?? key], description, options);
    });
  }

  /** 在实体类上新增一个字段 */
  public static defineProp(key: string, description: ExtensiblePropDescription = {}): void {
    if (!Object.prototype.hasOwnProperty.call(this, '__ExtensiblePropDescriptions__')) {
      this.__ExtensiblePropDescriptions__ = {};
    }

    if (this.__ExtensiblePropDescriptions__![key]) {
      throw new VerseaError(`Duplicate prop: ${key}`);
    }

    if (
      process.env.NODE_ENV !== 'production' &&
      typeof description.default === 'object' &&
      description.default !== null
    ) {
      console.warn(
        `[versea]Invalid default value for prop "${key}": Props with type Object/Array must use a factory function to return the default value.`,
      );
    }

    this.__ExtensiblePropDescriptions__![key] = description;
  }

  private _setEntityProp(
    key: string,
    value: unknown,
    description: ExtensiblePropDescription,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    options: Record<string, any>,
  ): void {
    const { default: defaultValue, required, validator, format } = description;
    if (value === undefined) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      value = typeof defaultValue === 'function' ? defaultValue(options) : defaultValue;
    }

    if (required && value === undefined) {
      throw new VerseaError(`Missing required prop: "${key}"`);
    }

    if (validator && !validator(value, options)) {
      throw new VerseaError(`Invalid prop: custom validator check failed for prop "${key}"`);
    }

    this[key] = format ? format(value, options) : value;
  }
}
