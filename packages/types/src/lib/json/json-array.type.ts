import type { JsonValue } from './json-value.type';

/**
 * Matches a JSON array.
 * @category JSON
 */
export type JsonArray = JsonValue[] | readonly JsonValue[];
