import type { SAFE_HTML } from '../utils/trust-html/trust-html.utils';

/**
 * An HTML the application trusts, which `@@innerHtml` renders as it is, without sanitizing it: created with
 * `trustHtml`, as Angular creates a `SafeHtml` with `bypassSecurityTrustHtml`.
 */
export interface SafeHtml {
  /**
   * The HTML trusted, under a symbol only `trustHtml` has.
   */
  readonly [SAFE_HTML]: string;
}
