import type { HostAttributeBinding } from './host-attribute-binding.type';

/**
 * The host attributes of a class, split by what they write, once per class: the attributes, bound one by one, and the
 * ones of `class`, of `style` and of `part`, each group bound as one source (see `HostStylingRun`).
 */
export type HostAttributeGroups = {
  /**
   * The attributes, `null` for none.
   */
  readonly attributes: readonly HostAttributeBinding[] | null;
  /**
   * The properties of `class`, `null` for none.
   */
  readonly class: readonly HostAttributeBinding[] | null;
  /**
   * The properties of `style`, `null` for none.
   */
  readonly style: readonly HostAttributeBinding[] | null;
  /**
   * The properties of `part`, `null` for none.
   */
  readonly part: readonly HostAttributeBinding[] | null;
};
