import type { StylingAttribute } from './styling-attribute.type';
import type { StylingSource } from './styling-source.type';

/**
 * The sources writing the `class` or the `style` of an element, merged key by key: for each key the strongest source
 * having an opinion wins, the template over the directives over the component, and in each level the keys bound one by
 * one over the string. It exists only once a second source writes the same attribute of the element: an element written
 * by one source is written directly (see `applyDirectStyling`).
 *
 * N.B. Deliberate, to save memory: a single source and a single written key are kept as they are, an array of the exact
 * length only from the second one, since most elements have two sources and a few keys. Do not make them arrays always.
 */
export type StylingState = {
  /**
   * The attribute.
   */
  readonly attribute: StylingAttribute;
  /**
   * The sources, from the strongest: by level, then, in a level, from the greatest order.
   */
  sources: StylingSource | StylingSource[] | null;
  /**
   * The keys the runtime wrote on the element: only they are removed when no source has an opinion on them, so that a
   * class or a property written by other code stays.
   */
  written: string | string[] | null;
};
