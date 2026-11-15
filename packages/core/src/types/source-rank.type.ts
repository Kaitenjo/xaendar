import type { StylingTier } from './styling/styling-tier.type';

/**
 * Where a source writing an attribute of an element stands among the other sources writing it: the `class`, the `style`
 * (see `StylingSource`) or any other attribute (see `AttributeOpinion`). Of two sources, the one of the lower level wins,
 * and, in the same level, the one of the greater order.
 */
export type SourceRank = {
  /**
   * The level of the source.
   */
  readonly tier: StylingTier;
  /**
   * The order of the source in its level: of two directives, the one with the greater order wins.
   */
  readonly order: number;
};
