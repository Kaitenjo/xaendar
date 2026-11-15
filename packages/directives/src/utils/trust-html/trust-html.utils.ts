import type { SafeHtml } from '../../types/safe-html.type';

/**
 * The key holding the HTML of a `SafeHtml`: a symbol the package does not export, so that only `trustHtml` creates
 * one, and no JSON can.
 */
export const SAFE_HTML = Symbol('xaendar.safeHtml');

/**
 * Marks an HTML as trusted: bound to the `html` of `@@innerHtml`, it is rendered as it is, without sanitizing it. The
 * equivalent of `bypassSecurityTrustHtml` of Angular.
 *
 * Use it only for an HTML the application builds, or that comes from a source it trusts and has already sanitized: the
 * scripts in its attributes (`onerror`, `href="javascript:…"`) run. Calling it where the HTML is built, rather than
 * turning the sanitization off where it is rendered, keeps every trusted HTML easy to find.
 *
 * @example
 * ```ts
 * public readonly badge = trustHtml('<svg viewBox="0 0 16 16"><path d="M8 0 16 16H0z" /></svg>');
 * ```
 *
 * @param html - The HTML to trust.
 * @returns The HTML, marked as trusted.
 */
export function trustHtml(html: string): SafeHtml {
  return { [SAFE_HTML]: html };
}
