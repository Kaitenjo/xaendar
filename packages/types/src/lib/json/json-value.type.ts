import type { JsonObject } from './json-object.type';
import type { JsonArray } from './json-array.type';
import type { JsonPrimitive } from './json-primitive.type';

/**
 * Matches any valid JSON value.
 * @see `Jsonify` if you need to transform a type to one that is assignable to `JsonValue`.
 * @category JSON
 */
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;
