import type { SourceRank } from '../source-rank.type';

/**
 * The value a source wants for an attribute of an element, other than `class` and `style`, registered in the
 * `AttributeState` of the attribute: the template rendering the element (an attribute bound on it, or in a branch of
 * one of its conditional bindings), a directive applied to it, or the component it is, ranked by its level and its
 * order (see `SourceRank`).
 */
export type AttributeOpinion = SourceRank & {
  /**
   * What the source is, to find it again when it changes: the constant of the attribute in the template, or the run of
   * the host attributes of a directive or of a component (see `HostAttributeRun`).
   */
  readonly owner: object;
  /**
   * The value of the binding, converted to the text of the attribute once it wins (see `_attributeValue`): `null` and
   * `undefined` have no opinion, leaving the attribute to the sources below.
   */
  value: unknown;
};
