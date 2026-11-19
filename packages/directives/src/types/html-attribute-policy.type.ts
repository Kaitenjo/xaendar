import type { HtmlNamePolicy } from './html-name-policy.type';

/**
 * The attributes the sanitizer keeps (see `HtmlSanitizerOptions`): on every element, and on some elements only.
 */
export interface HtmlAttributePolicy {
  /**
   * The attributes kept, or removed, on every element.
   */
  readonly global: HtmlNamePolicy;
  /**
   * The attributes kept, or removed, on an element only (`span[style]`), as `element[attribute` (`span[style`, the
   * prefix `img[data-` of `img[data-*]`): `null` when the options list none.
   */
  readonly scoped: HtmlNamePolicy | null;
}
