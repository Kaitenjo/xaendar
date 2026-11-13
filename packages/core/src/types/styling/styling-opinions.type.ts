/**
 * The opinions of a source on the keys of `class` or `style`, as a flat list of keys and values: `['on', true, 'off',
 * false]` for `class`, whose value tells whether the element has the class, `['width', '10px', 'color', 'red
 * !important']` for `style`, whose value is the one of the property, with its priority. A key the list does not hold is
 * one the source has no opinion on.
 *
 * N.B. Deliberate, to save memory: a flat array of the exact length instead of a `Map` (a hash table of ~140 bytes even
 * for one entry), since a source holds a few keys. Do not replace it with a `Map` or with an array of pairs.
 */
export type StylingOpinions = ReadonlyArray<string | boolean>;
