/**
 * The level of a source writing an attribute of an element, `class` and `style` included, from the strongest: `0` the
 * template rendering the element, `1` the directives applied to it (its host directives, then the ones of the template),
 * `2` the component it is.
 */
export type StylingTier = 0 | 1 | 2;
