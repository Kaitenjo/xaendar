import type { HostPropertyBinding } from './host-property-binding.type';

/**
 * The host properties of a class, split by what they write, once per class: the attributes, bound one by one, and the
 * ones of `class` and of `style`, each group bound as one source (see `HostStylingRun`).
 */
export type HostPropertyGroups = {
  /**
   * The attributes, `null` for none.
   */
  readonly attributes: readonly HostPropertyBinding[] | null;
  /**
   * The properties of `class`, `null` for none.
   */
  readonly class: readonly HostPropertyBinding[] | null;
  /**
   * The properties of `style`, `null` for none.
   */
  readonly style: readonly HostPropertyBinding[] | null;
};
