import type { StylingOpinions } from './styling-opinions.type';

/**
 * The opinions of the sources of a state merging the `class` or the `style` of an element (see `StylingState`), computed
 * from their values once for a change: for each source, from the strongest, its level, then its opinions on the keys
 * bound one by one and from its string, `null` for none.
 */
export type StylingViews = Array<number | StylingOpinions | null>;
