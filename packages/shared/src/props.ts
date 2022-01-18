/* eslint-disable no-prototype-builtins */
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { VerseaError } from './error';

export interface ExtensiblePropDescription {
  required?: boolean;
  default?: any;
  validator?: (value: any) => boolean;
}

function getDefaultValue(key: string, description: ExtensiblePropDescription): any {
  const def = description.default;
  if (process.env.NODE_ENV !== 'production' && typeof def === 'object' && def !== null) {
    console.warn(
      `Invalid default value for prop "${key}": Props with type Object/Array must use a factory function to return the default value.`,
    );
  }
  return typeof def === 'function' ? (def as Function)() : def;
}

export function setPropWithDescription(
  instance: any,
  key: string,
  value: any,
  description: ExtensiblePropDescription,
): void {
  if (value === undefined) {
    value = getDefaultValue(key, description);
  }

  if (description.required && value === undefined) {
    throw new VerseaError(`Missing required prop: "${key}"`);
  }

  if (description.validator && !description.validator(value)) {
    throw new VerseaError(`Invalid prop: custom validator check failed for prop "${key}"`);
  }

  instance[key] = value;
}
