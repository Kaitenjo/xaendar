import { cleanUrl, everySrcsetUrl, isMediaDataUrl, isUrlAttribute, readUrlScheme } from '@xaendar/internals';

/**
 * The character references of an attribute value the URLs are decoded with: the numeric ones, with or without `;` as
 * the HTML parser decodes them, and the named ones listed in `NAMED_REFERENCES`, with `;`.
 */
const CHARACTER_REFERENCE = /&#(?:[xX]([0-9a-fA-F]+)|([0-9]+));?|&([a-zA-Z]+);/g;

/**
 * The named character references the URLs are decoded with: the ones of the characters a scheme or its end can be
 * written with. A URL holding another one before its first `/`, `?` or `#` is not allowed, since it could hide its
 * scheme.
 */
const NAMED_REFERENCES: ReadonlyMap<string, string> = new Map([
  ['amp', '&'], ['apos', '\''], ['ast', '*'], ['colon', ':'], ['comma', ','], ['commat', '@'], ['dollar', '$'],
  ['equals', '='], ['excl', '!'], ['gt', '>'], ['lowbar', '_'], ['lpar', '('], ['lt', '<'], ['NewLine', String.fromCharCode(10)],
  ['num', '#'], ['percnt', '%'], ['period', '.'], ['plus', '+'], ['quest', '?'], ['quot', '"'], ['rpar', ')'],
  ['semi', ';'], ['sol', '/'], ['Tab', String.fromCharCode(9)]
]);

/**
 * The SVG animation elements, lowercase as the tokenizer reads them, whose `attributeName` chooses the attribute they
 * animate.
 */
const ANIMATION_ELEMENTS: ReadonlySet<string> = new Set(['animate', 'animatemotion', 'animatetransform', 'set']);

/**
 * The character the HTML parser decodes an invalid numeric character reference to: U+FFFD.
 */
const REPLACEMENT_CHARACTER = String.fromCharCode(0xfffd);

/**
 * Tells whether an attribute holds only URLs allowed: the attributes holding a URL (`href`, `src`, …), a list of
 * images (`srcset`, `imagesrcset`) or a list of URLs (`ping`); the other attributes always are.
 *
 * @param name - The name of the attribute, lowercase.
 * @param value - The value of the attribute as it is written, its character references not decoded.
 * @param schemes - The schemes allowed, lowercase.
 * @returns Whether the value can be kept.
 */
export function isSafeUrlAttribute(name: string, value: string, schemes: ReadonlySet<string>): boolean {
  switch (name) {
    case 'imagesrcset':
    case 'srcset':
      return isSafeSrcset(decodeCharacterReferences(value), schemes);
    case 'ping':
      return decodeCharacterReferences(value).split(/[ \t\n\f\r]+/).every(url => isSafeUrl(url, schemes));
    default:
      return !isUrlAttribute(name) || isSafeUrl(decodeCharacterReferences(value), schemes);
  }
}

/**
 * Tells whether the `attributeName` of an SVG animation element (`animate`, `set`, `animateMotion`,
 * `animateTransform`) can be kept: not when it names an `href`, whose URL the animation would write from its `to`,
 * `from`, `by` or `values`, which hold no URL the sanitizer checks. Any other attribute can be kept.
 *
 * @param element - The name of the element, lowercase.
 * @param name - The name of the attribute, lowercase.
 * @param value - The value of the attribute as it is written, its character references not decoded.
 * @returns Whether the attribute can be kept.
 */
export function isSafeAnimationTarget(element: string, name: string, value: string): boolean {
  if (name !== 'attributename' || !ANIMATION_ELEMENTS.has(element)) {
    return true;
  }

  const target = decodeCharacterReferences(value).trim().toLowerCase();
  return target !== 'href' && target !== 'xlink:href';
}

/**
 * Tells whether a URL is allowed: a relative URL, a URL of a scheme allowed, or a `data:` URL of an image, an audio or a
 * video in base64. The URL is read as the browser reads it: without the tabs and the line breaks it holds anywhere, nor
 * the control characters and the spaces around it.
 *
 * @param url - The URL, its character references decoded.
 * @param schemes - The schemes allowed, lowercase.
 * @returns Whether the URL can be kept.
 */
export function isSafeUrl(url: string, schemes: ReadonlySet<string>): boolean {
  const cleaned = cleanUrl(url);
  const end = cleaned.search(/[/?#]/);
  const head = end === -1 ? cleaned : cleaned.slice(0, end);
  // A character reference not decoded could hide the scheme
  if (/&[a-zA-Z]/.test(head)) {
    return false;
  }

  const scheme = readUrlScheme(head);
  return scheme === undefined || schemes.has(scheme) || (scheme === 'data' && isMediaDataUrl(cleaned));
}

/**
 * Tells whether every image of a `srcset` has a URL allowed. The candidates are read as the browser reads them: a URL
 * up to a white space, a URL ending with `,` ending its candidate, otherwise the descriptors up to the next `,` outside
 * parentheses.
 *
 * @param srcset - The value of the attribute, its character references decoded.
 * @param schemes - The schemes allowed, lowercase.
 * @returns Whether the value can be kept.
 */
export function isSafeSrcset(srcset: string, schemes: ReadonlySet<string>): boolean {
  return everySrcsetUrl(srcset, url => isSafeUrl(url, schemes));
}

/**
 * Decodes the character references of an attribute value the URLs are checked with (see `CHARACTER_REFERENCE`): the
 * other named ones are kept as they are.
 *
 * @param value - The value of the attribute as it is written.
 * @returns The value decoded.
 */
export function decodeCharacterReferences(value: string): string {
  return value.indexOf('&') === -1 ? value : value.replace(CHARACTER_REFERENCE, decodeReference);
}

/**
 * Decodes a character reference matched by `CHARACTER_REFERENCE`.
 *
 * @param reference - The reference.
 * @param hexadecimal - The digits of a hexadecimal numeric reference.
 * @param decimal - The digits of a decimal numeric reference.
 * @param name - The name of a named reference.
 * @returns The character the reference stands for, the reference itself for a name not listed in `NAMED_REFERENCES`.
 */
function decodeReference(reference: string, hexadecimal: string | undefined, decimal: string | undefined, name: string | undefined): string {
  if (name !== undefined) {
    return NAMED_REFERENCES.get(name) ?? reference;
  }

  const code = hexadecimal !== undefined ? parseInt(hexadecimal, 16) : parseInt(decimal!, 10);
  return code === 0 || code > 0x10ffff || (code >= 0xd800 && code <= 0xdfff) ? REPLACEMENT_CHARACTER : String.fromCodePoint(code);
}
