import type { SourceRank } from '../source-rank.type';
import type { StylingOpinions } from './styling-opinions.type';

/**
 * A source of the `class` or of the `style` of an element registered in its `StylingState`: the template rendering it
 * (its own bindings, or the ones of a branch of a conditional binding), a directive applied to it, or the component it
 * is, ranked by its level and its order (see `SourceRank`). Its opinions are split by form, since the keys bound one by
 * one win over the string of the same level.
 */
export type StylingSource = SourceRank & {
  /**
   * What the source is, to find it again when it changes: the constant of the bindings of the template, or the run of
   * the host attributes of a directive or of a component.
   */
  readonly owner: object;
  /**
   * The opinions of the keys bound one by one (`[class.on]`, `@HostAttribute('style.width.px')`), `null` for none.
   */
  keys: StylingOpinions | null;
  /**
   * The opinions of the string (`class="a b"`, `@HostAttribute('style')`), `null` for none.
   */
  string: StylingOpinions | null;
};
