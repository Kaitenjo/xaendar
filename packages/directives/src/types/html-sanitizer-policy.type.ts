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
  /**
   * The origins the resources a URL loads into the page can come from (the `src` of an `<iframe>`, the `data` of an
   * `<object>`…), the `trustedOrigins` of the security of the project: `null` when its `resourceUrls` is `'off'`.
   */
  readonly trustedOrigins: readonly string[] | null;
}
