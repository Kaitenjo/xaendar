import type { TrustedTypePolicy } from '../../types/trusted-type-policy.type';

/**
 * The Trusted Types policies of `@@innerHtml` created, by name: `null` for one the `Content-Security-Policy` does not
 * allow.
 *
 * N.B. Deliberate: the policies live in this module, which exports no function creating them, and are created by this
 * package alone. Their `createHTML` keeps the HTML as it is, since `renderHtml` sanitizes it before, or it is trusted
 * with `trustHtml()`: a function exported by a package, `@xaendar/core` included, would let any code of the page turn an
 * HTML never sanitized into a `TrustedHTML` of a policy the `Content-Security-Policy` allows. Do not export them.
 */
const policies = new Map<string, TrustedTypePolicy | null>();

/**
 * Prepares an HTML `@@innerHtml` writes into the `innerHTML` of an element: a `TrustedHTML` of its policy where the
 * browser supports Trusted Types and the `Content-Security-Policy` allows the policy, so that a page requiring them
 * (`require-trusted-types-for 'script'`) accepts it, the HTML itself otherwise.
 *
 * @param html - The HTML, sanitized or trusted.
 * @param policyName - The name of the policy, which the `trusted-types` of the `Content-Security-Policy` lists.
 * @returns What to assign to the `innerHTML`, typed as the string the DOM library of TypeScript expects.
 */
export function toTrustedHtml(html: string, policyName: string): string {
  const policy = readPolicy(policyName);
  return policy ? policy.createHTML(html) as unknown as string : html;
}

/**
 * Reads a Trusted Types policy, creating it the first time: its `createHTML` keeps the HTML as it is.
 *
 * @param name - The name of the policy.
 * @returns The policy, `null` where the browser does not support Trusted Types, or the `Content-Security-Policy` does
 *   not allow the name (assigning a string then fails when Trusted Types are required, as it must).
 */
function readPolicy(name: string): TrustedTypePolicy | null {
  const factory = globalThis.trustedTypes;
  if (!factory) {
    return null;
  }

  let policy = policies.get(name);
  if (policy === undefined) {
    try {
      policy = factory.createPolicy(name, { createHTML: keepHtml });
    } catch {
      policy = null;
    }

    policies.set(name, policy);
  }

  return policy;
}

/**
 * The `createHTML` of the policies of `@@innerHtml`: the HTML is sanitized, or trusted, before.
 *
 * @param html - The HTML.
 * @returns The same HTML.
 */
function keepHtml(html: string): string {
  return html;
}
