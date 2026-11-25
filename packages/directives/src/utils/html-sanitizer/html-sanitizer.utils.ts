import { _SECURITY } from '@xaendar/core';
import { describeUnsafeSanitizerOptions } from '@xaendar/internals';
import { HtmlSanitization } from '../../models/html-sanitization/html-sanitization.model';
import type { HtmlSanitizeResult } from '../../types/html-sanitize-result.type';
import type { HtmlSanitizerOptions } from '../../types/html-sanitizer-options.type';
import type { HtmlSanitizerPolicy } from '../../types/html-sanitizer-policy.type';
import { createAttributePolicy, createNamePolicy } from '../html-name-policy/html-name-policy.utils';
import { toAsciiLowerCase } from '../html-syntax/html-syntax.utils';

/**
 * The elements kept by default: the ones Angular keeps (`VALID_ELEMENTS` of its sanitizer), the text-level and block
 * elements, the lists, the tables and the media. No form, no SVG, no MathML.
 */
const DEFAULT_ELEMENTS: ReadonlySet<string> = new Set([
  'a', 'abbr', 'acronym', 'address', 'area', 'article', 'aside', 'audio', 'b', 'bdi', 'bdo', 'big', 'blockquote', 'br',
  'caption', 'center', 'cite', 'code', 'col', 'colgroup', 'dd', 'del', 'details', 'dfn', 'dialog', 'dir', 'div', 'dl',
  'dt', 'em', 'figcaption', 'figure', 'font', 'footer', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hgroup', 'hr', 'i',
  'img', 'ins', 'kbd', 'label', 'li', 'main', 'map', 'mark', 'menu', 'nav', 'ol', 'p', 'picture', 'pre', 'q', 'rp', 'rt',
  'ruby', 's', 'samp', 'section', 'small', 'source', 'span', 'strike', 'strong', 'sub', 'summary', 'sup', 'table',
  'tbody', 'td', 'tfoot', 'th', 'thead', 'time', 'tr', 'track', 'tt', 'u', 'ul', 'var', 'video', 'wbr'
]);

/**
 * The attributes kept by default: the ones Angular keeps (`URI_ATTRS` and `HTML_ATTRS` of its sanitizer), plus every
 * `aria-*` (see `DEFAULT_ATTRIBUTE_PREFIXES`). No `id` nor `name`, which could shadow the globals of the page (DOM
 * clobbering), no `style`, no `on*`.
 */
const DEFAULT_ATTRIBUTES: ReadonlySet<string> = new Set([
  'abbr', 'accesskey', 'align', 'alt', 'autoplay', 'axis', 'background', 'bgcolor', 'border', 'cellpadding',
  'cellspacing', 'cite', 'class', 'clear', 'color', 'cols', 'colspan', 'compact', 'controls', 'coords', 'datetime',
  'default', 'dir', 'download', 'face', 'headers', 'height', 'hidden', 'href', 'hreflang', 'hspace', 'ismap', 'itemprop',
  'itemscope', 'itemtype', 'kind', 'label', 'lang', 'language', 'longdesc', 'loop', 'media', 'muted', 'nohref', 'nowrap',
  'open', 'poster', 'preload', 'rel', 'rev', 'role', 'rows', 'rowspan', 'rules', 'scope', 'scrolling', 'shape', 'size',
  'sizes', 'span', 'src', 'srclang', 'srcset', 'start', 'summary', 'tabindex', 'target', 'title', 'translate', 'type',
  'usemap', 'valign', 'value', 'vspace', 'width', 'xlink:href'
]);

/**
 * The prefixes of the attributes kept by default: the ARIA attributes, which run no code.
 */
const DEFAULT_ATTRIBUTE_PREFIXES: readonly string[] = ['aria-'];

/**
 * The schemes the URLs may have by default.
 */
const DEFAULT_URL_SCHEMES: ReadonlySet<string> = new Set(['ftp', 'http', 'https', 'mailto', 'sms', 'tel']);

/**
 * The origins the resources loaded into the page can come from, as the security of the project asks (see
 * `HtmlSanitizerPolicy.trustedOrigins`): the same check as the URLs the templates bind to the attributes loading them.
 */
const TRUSTED_ORIGINS: readonly string[] | null = _SECURITY.resourceUrls === 'off' ? null : _SECURITY.trustedOrigins;

/**
 * What the sanitizer keeps without options.
 */
const DEFAULT_POLICY: HtmlSanitizerPolicy = {
  elements: createNamePolicy(DEFAULT_ELEMENTS, null, undefined, undefined),
  attributes: createAttributePolicy(DEFAULT_ATTRIBUTES, DEFAULT_ATTRIBUTE_PREFIXES, undefined, undefined),
  urlSchemes: DEFAULT_URL_SCHEMES,
  trustedOrigins: TRUSTED_ORIGINS
};

/**
 * What the sanitizer keeps with each object of options, read from it the first time it is used.
 */
const policies = new WeakMap<HtmlSanitizerOptions, HtmlSanitizerPolicy>();

/**
 * The options of the sanitizer for the whole project, the `html` of the security of `xaendar.json`, which the build
 * checks: `undefined` when it sets none.
 */
const PROJECT_OPTIONS: HtmlSanitizerOptions | undefined = _SECURITY.html;

/**
 * What the sanitizer keeps where a use passes no options: the options of the project, or the default ones.
 */
const PROJECT_POLICY: HtmlSanitizerPolicy = PROJECT_OPTIONS ? createPolicy(PROJECT_OPTIONS) : DEFAULT_POLICY;

/**
 * Sanitizes an HTML, as `@@innerHtml` does before rendering it: keeps only the elements and the attributes allowed,
 * and the URLs of an allowed scheme, and writes the result well formed, so that the browser reads it as it is written.
 * The equivalent of `sanitize(SecurityContext.HTML, html)` of the `DomSanitizer` of Angular, which works on the server
 * too, and can be configured.
 *
 * By default it keeps what Angular keeps: the text-level and block elements, the lists, the tables and the media, with
 * their presentational attributes, `class`, `title`, `lang`, the URLs and `aria-*`; it removes the scripts, the styles,
 * the templates, the forms, the SVG, the comments, `id`, `name`, `style` and the event handlers. An element removed
 * leaves its content in its place, but a `script`, a `style`, a `template`, a `noscript`, an `iframe` or an `object`,
 * removed with theirs. A URL is kept when relative, of the schemes `http`, `https`, `mailto`, `tel`, `ftp` and `sms`, or a
 * `data:` URL of an image, an audio or a video in base64: otherwise its attribute is removed, where Angular prefixes it
 * with `unsafe:`. The URLs of a `srcset`, which Angular does not check, are checked one by one.
 *
 * The options are read once for each object: create them once (a constant, a field), not at each call. They may not keep
 * what always runs code: a `script`, a `base` or a `meta`, an event handler attribute (`on*`), a `srcdoc`, a
 * `javascript:` or `vbscript:` URL; render such an HTML with `trustHtml`, or with a sanitizer of the application.
 *
 * The `html` of the `security` of `xaendar.json`, options of the same shape, applies to every HTML the project
 * sanitizes: the lists of the options passed are added to its lists, their `urlSchemes` replace its own.
 *
 * @example
 * ```ts
 * sanitizeHtml('<p onclick="steal()">Hi <script>steal()</script><b>there</b></p>');
 * // '<p>Hi <b>there</b></p>'
 * sanitizeHtml('<p style="color: red" data-id="1">Hi</p>', { allowAttributes: ['style', 'data-*'] });
 * // '<p style="color: red" data-id="1">Hi</p>'
 * ```
 *
 * @param html - The HTML to sanitize.
 * @param options - What to keep besides, or in place of, what is kept by default.
 * @returns The HTML sanitized.
 * @throws If the options keep what always runs code.
 */
export function sanitizeHtml(html: string, options?: HtmlSanitizerOptions): string {
  return sanitizeHtmlWithReport(html, options).html;
}

/**
 * Sanitizes an HTML as {@link sanitizeHtml} does, reporting what it removed.
 *
 * @param html - The HTML to sanitize.
 * @param options - What to keep besides, or in place of, what is kept by default.
 * @returns The HTML sanitized, and what was removed from it.
 * @throws If the options keep what always runs code.
 */
export function sanitizeHtmlWithReport(html: string, options?: HtmlSanitizerOptions): HtmlSanitizeResult {
  return new HtmlSanitization(readPolicy(options)).run(html);
}

/**
 * Reads what the sanitizer keeps with some options, once for each object of options.
 *
 * @param options - The options, `undefined` for the default ones.
 * @returns What the sanitizer keeps.
 * @throws If the options keep what always runs code (see {@link assertSafeOptions}).
 */
function readPolicy(options: HtmlSanitizerOptions | undefined): HtmlSanitizerPolicy {
  if (!options) {
    return PROJECT_POLICY;
  }

  let policy = policies.get(options);
  if (!policy) {
    assertSafeOptions(options);
    policy = createPolicy(PROJECT_OPTIONS ? joinOptions(PROJECT_OPTIONS, options) : options);
    policies.set(options, policy);
  }

  return policy;
}

/**
 * Ensures the options keep nothing that always runs code, whatever the HTML (see `describeUnsafeSanitizerOptions` of
 * `@xaendar/internals`, which the build applies to the `html` of the security of `xaendar.json` too).
 *
 * @param options - The options.
 * @throws If the options keep what always runs code.
 */
function assertSafeOptions(options: HtmlSanitizerOptions): void {
  const unsafe = describeUnsafeSanitizerOptions(options);
  if (unsafe !== undefined) {
    throw new Error(`${unsafe}: render a trusted HTML with trustHtml(), or with a sanitizer of the application, instead`);
  }
}

/**
 * Creates what the sanitizer keeps with some options.
 *
 * @param options - The options, safe (see {@link assertSafeOptions}).
 * @returns What the sanitizer keeps.
 */
function createPolicy(options: HtmlSanitizerOptions): HtmlSanitizerPolicy {
  return {
    elements: createNamePolicy(DEFAULT_ELEMENTS, null, options.allowElements, options.removeElements),
    attributes: createAttributePolicy(DEFAULT_ATTRIBUTES, DEFAULT_ATTRIBUTE_PREFIXES, options.allowAttributes, options.removeAttributes),
    urlSchemes: options.urlSchemes ? new Set(options.urlSchemes.map(toAsciiLowerCase)) : DEFAULT_URL_SCHEMES,
    trustedOrigins: TRUSTED_ORIGINS
  };
}

/**
 * Joins the options of the project with the ones of a use: the lists of the use are added to the ones of the project,
 * its schemes replace the project's.
 *
 * @param project - The options of the project.
 * @param options - The options of the use.
 * @returns The options the use sanitizes with.
 */
function joinOptions(project: HtmlSanitizerOptions, options: HtmlSanitizerOptions): HtmlSanitizerOptions {
  return {
    allowElements: joinLists(project.allowElements, options.allowElements),
    allowAttributes: joinLists(project.allowAttributes, options.allowAttributes),
    removeElements: joinLists(project.removeElements, options.removeElements),
    removeAttributes: joinLists(project.removeAttributes, options.removeAttributes),
    urlSchemes: options.urlSchemes ?? project.urlSchemes
  };
}

/**
 * Joins two lists of names, either of them possibly missing.
 *
 * @param first - The first list.
 * @param second - The second list.
 * @returns Both lists in one, one of them as it is when the other is missing or empty.
 */
function joinLists(first: readonly string[] | undefined, second: readonly string[] | undefined): readonly string[] | undefined {
  if (!first?.length) {
    return second;
  }

  return second?.length ? first.concat(second) : first;
}
