import type { StylingOpinions } from './styling-opinions.type';
import type { StylingTier } from './styling-tier.type';

/**
 * A source of the `class` or of the `style` of an element registered in its `StylingState`: the template rendering it
 * (its own bindings, or the ones of a branch of a conditional binding), a directive applied to it, or the component it
 * is. Its opinions are split by form, since the keys bound one by one win over the string of the same level.
 */
export type StylingSource = {
  /**
   * What the source is, to find it again when it changes: the constant of the bindings of the template, or the run of
   * the host properties of a directive or of a component.
   */
  readonly owner: object;
  /**
   * The level of the source.
   */
  readonly tier: StylingTier;
  /**
   * The order of the source in its level: of two directives, the one applied later, with the greater order, wins.
   */
  readonly order: number;
  /**
   * The opinions of the keys bound one by one (`[class.on]`, `@HostProperty('style.width.px')`), `null` for none.
   */
  keys: StylingOpinions | null;
  /**
   * The opinions of the string (`class="a b"`, `@HostProperty('style')`), `null` for none.
   */
  string: StylingOpinions | null;
};
