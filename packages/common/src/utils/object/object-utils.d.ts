import { NonEmptyObject } from 'type-fest';
/**
 * Checks if an object is not empty by verifying if it has at least one property.
 * @param object - The object to check
 * @returns True if the object has properties, false otherwise
 */
export declare function isNonEmpty<Obj extends object>(object: Obj): object is NonEmptyObject<Obj>;
/**
 * Checks if an object is empty by verifying if it has no properties.
 * @param object - The object to check
 * @returns True if the object has no properties, false otherwise
 */
export declare function isEmpty<Obj extends object>(object: Obj): boolean;
/**
 * Returns an array of the object's own enumerable property names.
 * @template Obj The object type
 * @template Key The key type, constrained to keyof Obj
 * @param object - The object to get keys from
 * @returns An array of property names
 */
export declare function keys<Obj extends object, Key extends keyof Obj>(object: Obj): Key[];
export declare function keys(object: undefined): undefined;
/**
 * Returns an array of key-value pairs for the object's own enumerable properties.
 * @template Obj The object type
 * @template Key The key type, constrained to keyof Obj
 * @template Value The value type, defaults to unknown
 * @param object - The object to get entries from
 * @returns An array of [key, value] tuples
 */
export declare function entries<Obj extends object, Key extends keyof Obj, Value extends Obj[Key] = Obj[Key]>(object: Obj): [Key, Value][];
export declare function entries(object: undefined): undefined;
/**
 * Returns an array of the object's own enumerable property values.
 * @template Obj The object type
 * @template Value The value type, defaults to unknown
 * @param object - The object to get values from
 * @returns An array of property values
 */
export declare function values<Obj extends object, Key extends keyof Obj, Value extends Obj[Key] = Obj[Key]>(object: Obj): Value[];
export declare function values(object: undefined): undefined;
