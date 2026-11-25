import { _toTrustedHtml } from '@xaendar/core';
import type { HtmlContent } from '../../types/html-content.type';
import type { HtmlSanitizeReport } from '../../types/html-sanitize-report.type';
import type { HtmlSanitizerOptions } from '../../types/html-sanitizer-options.type';
import type { HtmlSanitizer } from '../../types/html-sanitizer.type';
import { sanitizeHtmlWithReport } from '../html-sanitizer/html-sanitizer.utils';
import { SAFE_HTML } from '../trust-html/trust-html.utils';

/**
 * The name of the Trusted Types policy the HTML sanitized by `@@innerHtml` is written with.
 */
export const SANITIZED_HTML_POLICY = 'xaendar#inner-html';

/**
 * The name of the Trusted Types policy the HTML `@@innerHtml` does not sanitize is written with: the one trusted with
 * `trustHtml`, and the one returned by a sanitizer of the application. A `Content-Security-Policy` can allow the
 * sanitized HTML only, leaving this name out of its `trusted-types`.
 */
export const UNSANITIZED_HTML_POLICY = 'xaendar#inner-html-unsafe';

/**
 * Renders an HTML as the content of an element, replacing the one it has (see `InnerHtmlDirective`): sanitized with
 * `sanitizeHtml` and the options given, or with the sanitizer given in its place, or as it is when trusted with
 * `trustHtml`. Where the browser supports Trusted Types, the HTML is written as a `TrustedHTML` of the policy
 * `xaendar#inner-html` when sanitized here, `xaendar#inner-html-unsafe` otherwise.
 *
 * @param element - The element to fill: an element of the server takes the HTML as a string.
 * @param content - The HTML, `null` or `undefined` to empty the element.
 * @param options - What the sanitizer keeps besides, or in place of, what it keeps by default.
 * @param sanitizer - The sanitizer to use in place of the one of the directives, `undefined` for the latter.
 * @returns What the sanitizer of the directives removed, `undefined` when it removed nothing, or did not run.
 */
export function renderHtml(element: Element, content: HtmlContent, options: HtmlSanitizerOptions | undefined, sanitizer: HtmlSanitizer | undefined): HtmlSanitizeReport | undefined {
  if (!content) {
    writeHtml(element, '', UNSANITIZED_HTML_POLICY);
    return undefined;
  }

  if (typeof content !== 'string') {
    writeHtml(element, content[SAFE_HTML], UNSANITIZED_HTML_POLICY);
    return undefined;
  }

  if (sanitizer) {
    writeHtml(element, sanitizer(content), UNSANITIZED_HTML_POLICY);
    return undefined;
  }

  const result = sanitizeHtmlWithReport(content, options);
  writeHtml(element, result.html, SANITIZED_HTML_POLICY);
  return result.report;
}

/**
 * Writes an HTML into the `innerHTML` of an element, as a `TrustedHTML` of a policy where the browser supports Trusted
 * Types and the `Content-Security-Policy` allows the policy, as a string otherwise (see `_toTrustedHtml`).
 *
 * @param element - The element.
 * @param html - The HTML.
 * @param policyName - The name of the Trusted Types policy.
 */
function writeHtml(element: Element, html: string, policyName: string): void {
  element.innerHTML = _toTrustedHtml(html, policyName);
}
