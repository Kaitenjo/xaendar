import type { TrustedTypePolicy } from './trusted-type-policy.type';

/**
 * The `trustedTypes` global of the browsers supporting the Trusted Types API, as far as the directives use it.
 */
export interface TrustedTypePolicyFactory {
  /**
   * Creates a policy.
   *
   * @param name - The name of the policy, which the `trusted-types` directive of the `Content-Security-Policy` must
   *   allow.
   * @param rules - The functions of the policy: `createHTML` returns the HTML a `TrustedHTML` holds, from the one given.
   * @returns The policy.
   * @throws When the `Content-Security-Policy` does not allow the name, or allows it once and it is already used.
   */
  createPolicy(name: string, rules: { createHTML(html: string): string }): TrustedTypePolicy;
}
