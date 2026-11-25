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
 * The elements the options may not allow, whatever the attributes kept, with the reason: a `script` runs once the page
 * rendered on the server holds it, a `base` changes where every relative URL of the page leads, a `meta` can send the
 * page elsewhere.
 */
const UNSAFE_ELEMENTS: ReadonlyMap<string, string> = new Map([
  ['base', 'which changes where every relative URL of the page leads'],
  ['meta', 'which can send the page elsewhere (http-equiv="refresh")'],
  ['script', 'whose code the browser runs once the page rendered on the server holds it']
]);

/**
 * The schemes the options may not allow, which run code.
 */
const UNSAFE_URL_SCHEMES: ReadonlySet<string> = new Set(['javascript', 'vbscript']);

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
 * The options are read once for each object: create them once (a constant, a field), not at each call. They may not keep
 * what always runs code: a `script`, a `base` or a `meta`, an event handler attribute (`on*`), a `srcdoc`, a
 * `javascript:` or `vbscript:` URL; render such an HTML with `trustHtml`, or with a sanitizer of the application.
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
    return DEFAULT_POLICY;
  }

  let policy = policies.get(options);
  if (!policy) {
    assertSafeOptions(options);
    policy = {
      elements: createNamePolicy(DEFAULT_ELEMENTS, null, options.allowElements, options.removeElements),
      attributes: createAttributePolicy(DEFAULT_ATTRIBUTES, DEFAULT_ATTRIBUTE_PREFIXES, options.allowAttributes, options.removeAttributes),
      urlSchemes: options.urlSchemes ? new Set(options.urlSchemes.map(toAsciiLowerCase)) : DEFAULT_URL_SCHEMES
    };
    policies.set(options, policy);
  }

  return policy;
}

/**
 * Ensures the options keep nothing that always runs code, whatever the HTML: a `script`, a `base` or a `meta` (see
 * `UNSAFE_ELEMENTS`), an event handler attribute or a `srcdoc`, on every element or on some (`img[onerror]`), a
 * `javascript:` or `vbscript:` URL. A name ending with `*` matching one of them counts as listing it (`o*`).
 *
 * @param options - The options.
 * @throws If the options keep what always runs code.
 */
function assertSafeOptions({ allowElements, allowAttributes, urlSchemes }: HtmlSanitizerOptions): void {
  const instead = 'render a trusted HTML with trustHtml(), or with a sanitizer of the application, instead';
  if (allowElements?.length) {
    for (let i = 0; i < allowElements.length; i++) {
      const listed = toAsciiLowerCase(allowElements[i]);
      for (const [element, reason] of UNSAFE_ELEMENTS) {
        if (listsName(listed, element, false)) {
          throw new Error(`The allowElements of the sanitizer list ${allowElements[i]}, keeping <${element}>, ${reason}: ${instead}`);
        }
      }
    }
  }

  if (allowAttributes?.length) {
    for (let i = 0; i < allowAttributes.length; i++) {
      const written = toAsciiLowerCase(allowAttributes[i]);
      const listed = written.endsWith(']') ? written.slice(written.indexOf('[') + 1, -1) : written;
      if (listsName(listed, 'on', true) || listsName(listed, 'srcdoc', false)) {
        throw new Error(`The allowAttributes of the sanitizer list ${allowAttributes[i]}, keeping an attribute the browser runs (on*, srcdoc): ${instead}`);
      }
    }
  }

  const scheme = urlSchemes?.find(listed => UNSAFE_URL_SCHEMES.has(toAsciiLowerCase(listed)));
  if (scheme !== undefined) {
    throw new Error(`The urlSchemes of the sanitizer list ${scheme}, a scheme running code: ${instead}`);
  }
}

/**
 * Tells whether a name the options list matches a name, or the names starting with a prefix: as it is, or as a prefix
 * ending with `*` (`o*` matches `onclick`).
 *
 * @param listed - The name listed, lowercase.
 * @param name - The name, or the prefix.
 * @param prefix - Whether `name` is a prefix of names (`on`).
 * @returns `true` when the name listed matches it.
 */
function listsName(listed: string, name: string, prefix: boolean): boolean {
  if (listed.endsWith('*')) {
    const start = listed.slice(0, -1);
    return name.startsWith(start) || (prefix && start.startsWith(name));
  }

  return prefix ? listed.startsWith(name) : listed === name;
}
