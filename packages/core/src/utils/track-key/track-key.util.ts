/**
 * Encodes the key the `track` of a `@for` gives an item, as the marker of the item holds it (see `_SSR_MARKERS`): `n`
 * and a number, `s` and a string, so that `1` and `'1'` stay distinct keys, as they are for the browser. The string is
 * encoded as a URI component, which never holds `>`, so that the marker cannot end early. The server writes the keys
 * this way, and the browser compares its own keys with them.
 *
 * @example
 * _encodeTrackKey(42); // 'n42'
 * _encodeTrackKey('a b'); // 'sa%20b'
 *
 * @param key - The key of the item.
 * @returns The encoded key.
 */
export function _encodeTrackKey(key: string | number): string {
  return typeof key === 'number' ? `n${key}` : `s${encodeURIComponent(key)}`;
}
