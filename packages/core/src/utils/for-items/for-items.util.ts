/**
 * Reads the items a `@for` iterates, as an array, in the browser and on the server alike: an array as it is, a number
 * `n` as the numbers from `0` to `n - 1`, and any other iterable (a `Map`, a `Set`, a generator…) as the array of the
 * values it yields, so that the `@for` knows how many they are (`$last`, `$count`) and reads them by index.
 *
 * A string is rejected, although it is iterable and has a `length`: iterated by mistake it would render a row per
 * character. `null`, `undefined` and any other value are rejected too.
 *
 * N.B. Deliberate: the values of an iterable that is not an array are copied with `Array.from`, which may leave spare
 * slots in the array. The array lives only during the run of the `@for` reading it: its rows and their keys are arrays
 * of their exact length. Do not copy an array, which is read as it is.
 *
 * @param value - The value of the expression of the `@for`.
 * @returns The items.
 * @throws If the value is a string, or neither an array, a number nor an iterable.
 */
export function _forItems(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === 'number') {
    return Array.from({ length: value }, (_value, index) => index);
  }

  if (typeof value !== 'string' && typeof (value as Partial<Iterable<unknown>> | null | undefined)?.[Symbol.iterator] === 'function') {
    return Array.from(value as Iterable<unknown>);
  }

  throw new TypeError(`@for iterates an array, a number or an iterable (a Map, a Set…), not ${describe(value)}`);
}

/**
 * Describes a value a `@for` cannot iterate, for its error.
 *
 * @param value - The value.
 * @returns `null`, `undefined`, or the kind of the value: `a string`, `an object`…
 */
function describe(value: unknown): string {
  if (value === null || value === undefined) {
    return `${value}`;
  }

  const kind = typeof value;
  return /^[aeiou]/.test(kind) ? `an ${kind}` : `a ${kind}`;
}
