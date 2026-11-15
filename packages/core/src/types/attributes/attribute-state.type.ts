import type { AttributeOpinion } from './attribute-opinion.type';

/**
 * The sources writing an attribute of an element, other than `class` and `style`, merged as a whole: the strongest source
 * with an opinion wins, the template over the directives over the component, and the directive with the greater order in
 * its level. It exists only once a second level writes the same attribute of the element, or may: an attribute written by
 * one source is written directly (see `writeAttribute`).
 *
 * N.B. Deliberate, to save memory: a single opinion is kept as it is, an array of the exact length only from the second
 * one, and an element keeps the states of its attributes under one entry (see `getAttributeState`), since most elements
 * have none and the others one or two. Do not make the opinions an array always, nor keep a `Map` of the attributes.
 */
export type AttributeState = {
  /**
   * The name of the attribute.
   */
  readonly name: string;
  /**
   * The opinions of the sources, from the strongest: by level, then, in a level, from the greatest order.
   */
  opinions: AttributeOpinion | AttributeOpinion[] | null;
  /**
   * Whether the runtime wrote the attribute the element holds: only then it is removed when no source has an opinion on
   * it any more, so that a value written by other code stays.
   */
  written: boolean;
};
