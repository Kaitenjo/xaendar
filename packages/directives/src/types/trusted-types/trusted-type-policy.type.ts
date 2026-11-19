import type { TrustedHtml } from './trusted-html.type';

/**
 * A policy of the Trusted Types API, as far as the directives create a `TrustedHTML` with it.
 */
export interface TrustedTypePolicy {
  /**
   * Creates a `TrustedHTML` from an HTML, through the `createHTML` the policy was created with.
   *
   * @param html - The HTML.
   * @returns The `TrustedHTML` holding it.
   */
  createHTML(html: string): TrustedHtml;
}
