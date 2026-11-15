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
 * What the sanitizer keeps without options.
 */
const DEFAULT_POLICY: HtmlSanitizerPolicy = {
  elements: createNamePolicy(DEFAULT_ELEMENTS, null, undefined, undefined),
  attributes: createAttributePolicy(DEFAULT_ATTRIBUTES, DEFAULT_ATTRIBUTE_PREFIXES, undefined, undefined),
  urlSchemes: DEFAULT_URL_SCHEMES
};

/**
 * What the sanitizer keeps with each object of options, read from it the first time it is used.
 */
const policies = new WeakMap<HtmlSanitizerOptions, HtmlSanitizerPolicy>();

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
 * The options are read once for each object: create them once (a constant, a field), not at each call.
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
 */
export function sanitizeHtmlWithReport(html: string, options?: HtmlSanitizerOptions): HtmlSanitizeResult {
  return new HtmlSanitization(readPolicy(options)).run(html);
}

/**
 * Reads what the sanitizer keeps with some options, once for each object of options.
 *
 * @param options - The options, `undefined` for the default ones.
 * @returns What the sanitizer keeps.
 */
function readPolicy(options: HtmlSanitizerOptions | undefined): HtmlSanitizerPolicy {
  if (!options) {
    return DEFAULT_POLICY;
  }

  let policy = policies.get(options);
  if (!policy) {
    policy = {
      elements: createNamePolicy(DEFAULT_ELEMENTS, null, options.allowElements, options.removeElements),
      attributes: createAttributePolicy(DEFAULT_ATTRIBUTES, DEFAULT_ATTRIBUTE_PREFIXES, options.allowAttributes, options.removeAttributes),
      urlSchemes: options.urlSchemes ? new Set(options.urlSchemes.map(toAsciiLowerCase)) : DEFAULT_URL_SCHEMES
    };
    policies.set(options, policy);
  }

  return policy;
}
