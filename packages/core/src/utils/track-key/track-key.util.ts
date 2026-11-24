/**
 * Encodes the key the `track` of a `@for` gives an item, as the marker of the item holds it (see `_SSR_MARKERS`): `n`
 * and a number, `s` and a string, so that `1` and `'1'` stay distinct keys, as they are for the browser. The string is
 * encoded as a URI component, which never holds `>`, so that the marker cannot end early. The server writes the keys
 * this way, and the browser compares its own keys with them.
 *
 * N.B. The string is made well formed first, a lone surrogate becoming `U+FFFD`: a key may come from a user, and
 * `encodeURIComponent` throws for a lone surrogate (`'\uD800'`), which would fail the rendering of the page on the server
 * and its hydration. Do not encode the key as it is.
 *
 * @example
 * _encodeTrackKey(42); // 'n42'
 * _encodeTrackKey('a b'); // 'sa%20b'
 *
 * @param key - The key of the item.
 * @returns The encoded key.
 */
export function _encodeTrackKey(key: string | number): string {
  return typeof key === 'number' ? `n${key}` : `s${encodeURIComponent(key.toWellFormed())}`;
}
