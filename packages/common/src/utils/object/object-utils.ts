import { NonEmptyObject } from 'type-fest';

/**
 * Checks if an object is not empty by verifying if it has at least one property.
 * @param object - The object to check
 * @returns True if the object has properties, false otherwise
 */
export function isNonEmpty<Obj extends object>(object: Obj): object is NonEmptyObject<Obj> {
  return !!Object.keys(object).length;
}

/**
 * Checks if an object is empty by verifying if it has no properties.
 * @param object - The object to check
 * @returns True if the object has no properties, false otherwise
 */
export function isEmpty<Obj extends object>(object: Obj): boolean {
  return !isNonEmpty(object);
}

/**
 * Returns an array of the object's own enumerable property names.
 * @template Obj The object type
 * @template Key The key type: the keys of Obj as strings, as `Object.keys` returns them (`1` becomes `'1'`)
 * @param object - The object to get keys from, or `undefined`
 * @returns An array of property names, `undefined` if the object is `undefined`
 */
export function keys<Obj extends object, Key extends `${Exclude<keyof Obj, symbol>}`>(object: Obj): Key[];
export function keys(object: undefined): undefined;
export function keys<Obj extends object, Key extends `${Exclude<keyof Obj, symbol>}`>(object: Obj | undefined): Key[] | undefined;
export function keys<
  Obj extends object,
  Key extends `${Exclude<keyof Obj, symbol>}`
>(object: Obj | undefined): Key[] | undefined {
  return object ? Object.keys(object) as Key[] : undefined;
}

/**
 * Returns an array of key-value pairs for the object's own enumerable properties.
 * @template Obj The object type
 * @template Key The key type: the keys of Obj as strings, as `Object.entries` returns them (`1` becomes `'1'`)
 * @template Value The value type, defaults to the values of Obj
 * @param object - The object to get entries from, or `undefined`
 * @returns An array of [key, value] tuples, `undefined` if the object is `undefined`
 */
export function entries<Obj extends object, Key extends `${Exclude<keyof Obj, symbol>}`, Value extends Obj[keyof Obj] = Obj[keyof Obj]>(object: Obj): [Key, Value][];
export function entries(object: undefined): undefined;
export function entries<Obj extends object, Key extends `${Exclude<keyof Obj, symbol>}`, Value extends Obj[keyof Obj] = Obj[keyof Obj]>(object: Obj | undefined): [Key, Value][] | undefined;
export function entries<
  Obj extends object,
  Key extends `${Exclude<keyof Obj, symbol>}`,
  Value extends Obj[keyof Obj] = Obj[keyof Obj]
>(object: Obj | undefined): [Key, Value][] | undefined {
  return object ? Object.entries(object) as [Key, Value][] : undefined;
}

/**
 * Returns an array of the object's own enumerable property values.
 * @template Obj The object type
 * @template Key The key type, constrained to keyof Obj
 * @template Value The value type, defaults to the values of Obj
 * @param object - The object to get values from, or `undefined`
 * @returns An array of property values, `undefined` if the object is `undefined`
 */
export function values<Obj extends object, Key extends keyof Obj, Value extends Obj[Key] = Obj[Key]>(object: Obj): Value[];
export function values(object: undefined): undefined;
export function values<Obj extends object, Key extends keyof Obj, Value extends Obj[Key] = Obj[Key]>(object: Obj | undefined): Value[] | undefined;
export function values<
  Obj extends object,
  Key extends keyof Obj,
  Value extends Obj[Key] = Obj[Key]
>(object: Obj | undefined): Value[] | undefined {
  return object ? Object.values(object) : undefined;
}
