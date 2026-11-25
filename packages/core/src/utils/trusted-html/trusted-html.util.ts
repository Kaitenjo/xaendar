import type { TrustedTypePolicy } from '../../types/trusted-types/trusted-type-policy.type';

/**
 * The name of the Trusted Types policy the static content of a standard `<template>` is written with: the HTML the
 * compiler serialized from the template, which holds no value of the application.
 */
export const TEMPLATE_CONTENT_POLICY = 'xaendar#template';

/**
 * The Trusted Types policies created, by name: `null` for one the `Content-Security-Policy` does not allow.
 */
const policies = new Map<string, TrustedTypePolicy | null>();

/**
 * Prepares an HTML Xaendar writes into the `innerHTML` of an element: a `TrustedHTML` of a policy where the browser
 * supports Trusted Types and the `Content-Security-Policy` allows the policy, so that a page requiring them
 * (`require-trusted-types-for 'script'`) accepts it, the HTML itself otherwise. The policy keeps the HTML as it is: it is
 * trusted, or sanitized, before.
 *
 * @param html - The HTML.
 * @param policyName - The name of the policy, which the `trusted-types` of the `Content-Security-Policy` lists.
 * @returns What to assign to the `innerHTML`, typed as the string the DOM library of TypeScript expects.
 */
export function _toTrustedHtml(html: string, policyName: string): string {
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
 * The `createHTML` of the Trusted Types policies of Xaendar: the HTML is trusted, or sanitized, before.
 *
 * @param html - The HTML.
 * @returns The same HTML.
 */
function keepHtml(html: string): string {
  return html;
}
