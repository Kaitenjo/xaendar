/**
 * A `TrustedHTML` of the Trusted Types API, which the elements take in their `innerHTML` where the
 * `Content-Security-Policy` requires it (`require-trusted-types-for 'script'`). The DOM library of TypeScript does not
 * declare it.
 */
export interface TrustedHtml {
  /**
   * Returns the HTML it holds.
   *
   * @returns The HTML.
   */
  toString(): string;
}
