import { _encodeTrackKey, _SSR_MARKERS } from '@xaendar/core';

/**
 * Returns the items a `@for` iterates, as the client iterates them: the items of an array, or `0, 1, …, n - 1` for a
 * number `n`.
 *
 * @param iterable - The value of the iterable expression of the `@for`.
 * @returns The items.
 */
export function _ssrItems(iterable: unknown[] | number): unknown[] {
  return typeof iterable === 'number' ? Array.from({ length: iterable }, (_item, index) => index) : iterable;
}

/**
 * Writes the marker opening an item of a `@for`, holding the key its `track` gives, encoded as the browser compares it
 * (see `_encodeTrackKey`): `n` and a number, `s` and a string encoded as a URI component, which never ends the marker.
 *
 * @example
 * _ssrItemMarker(42); // '<!--xd-item:n42-->'
 * _ssrItemMarker('a b'); // '<!--xd-item:sa%20b-->'
 *
 * @param key - The key of the item.
 * @returns The marker.
 */
export function _ssrItemMarker(key: string | number): string {
  return `<!--${_SSR_MARKERS.item}:${_encodeTrackKey(key)}-->`;
}
