/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ExtensiblePropDescription, setPropWithDescription } from './props';

/**
 * 获取所有的派生类
 * @param target 派生类的实例
 * @param baseClass 基础类
 */
function findAllDerivedClass(target: any, baseClass: any, currentValue: any[] = []): any[] {
  const targetConstructor = target.constructor;

  // 只寻找派生类，不包含这个基类
  if (targetConstructor === baseClass) {
    return currentValue;
  }

  const result: any[] = [...currentValue];
  if (targetConstructor && !currentValue.includes(targetConstructor)) {
    result.push(targetConstructor);
  }

  if (!target.__proto__) {
    return result;
  }

  return findAllDerivedClass(target.__proto__, baseClass, result);
}

/**
 * ExtensibleEntity 是可扩展实体类，可以在类上定义新的字段
 */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class ExtensibleEntity {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  private static __extensiblePropDescriptions__: Record<string, ExtensiblePropDescription>;

  constructor(options: Record<string, any> = {}) {
    const constructors = findAllDerivedClass(this, ExtensibleEntity);
    // 从子类开始遍历，子类 -> 孙子类 -> ...
    constructors.reverse().forEach((ctor) => {
      const propDescriptions: Record<string, ExtensiblePropDescription> = ctor.__extensiblePropDescriptions__;
      Object.keys(propDescriptions).forEach((name: string) => {
        setPropWithDescription(this, name, options[name], propDescriptions[name]);
      });
    });
  }

  public static defineProp(name: string, description: ExtensiblePropDescription): void {
    // eslint-disable-next-line no-prototype-builtins
    if (!this.hasOwnProperty('__extensiblePropDescriptions__')) {
      this.__extensiblePropDescriptions__ = {};
    }

    this.__extensiblePropDescriptions__[name] = description;
  }
}
