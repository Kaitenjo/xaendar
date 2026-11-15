import type { HtmlAttributePolicy } from './html-attribute-policy.type';
import type { HtmlNamePolicy } from './html-name-policy.type';

/**
 * What the sanitizer keeps, read from `HtmlSanitizerOptions` once for each object of options.
 */
export interface HtmlSanitizerPolicy {
  /**
   * The elements kept.
   */
  readonly elements: HtmlNamePolicy;
  /**
   * The attributes kept.
   */
  readonly attributes: HtmlAttributePolicy;
  /**
   * The schemes the URLs may have, lowercase.
   */
  readonly urlSchemes: ReadonlySet<string>;
}
