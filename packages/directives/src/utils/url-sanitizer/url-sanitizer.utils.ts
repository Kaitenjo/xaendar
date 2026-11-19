import { isWhitespace } from '../html-syntax/html-syntax.utils';

/**
 * The attributes holding a single URL, of HTML and of SVG.
 */
const URL_ATTRIBUTES: ReadonlySet<string> = new Set([
  'action', 'background', 'cite', 'codebase', 'data', 'dynsrc', 'formaction', 'href', 'icon', 'itemtype', 'longdesc',
  'lowsrc', 'manifest', 'poster', 'src', 'xlink:href'
]);

/**
 * The URLs `data:` kept whatever the schemes allowed: an image, an audio or a video in base64, which runs no code
 * (an SVG image, which can, is not among them).
 */
const DATA_MEDIA_URL = /^data:(?:image[/](?:avif|bmp|gif|jpeg|jpg|png|tiff|webp)|video[/](?:mpeg|mp4|ogg|webm)|audio[/](?:mp3|mpeg|oga|ogg|opus|wav));base64,[a-z0-9+/]+=*$/i;

/**
 * The scheme of a URL: letters, digits, `+`, `-` and `.` after a letter, up to a `:`.
 */
const SCHEME = /^([a-z][a-z0-9+.-]*):/i;

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
 * The character the HTML parser decodes an invalid numeric character reference to: U+FFFD.
 */
const REPLACEMENT_CHARACTER = String.fromCharCode(0xfffd);

/**
 * Tells whether an attribute holds only URLs allowed: the attributes holding a URL (`href`, `src`, …), a list of
 * images (`srcset`) or a list of URLs (`ping`); the other attributes always are.
 *
 * @param name - The name of the attribute, lowercase.
 * @param value - The value of the attribute as it is written, its character references not decoded.
 * @param schemes - The schemes allowed, lowercase.
 * @returns Whether the value can be kept.
 */
export function isSafeUrlAttribute(name: string, value: string, schemes: ReadonlySet<string>): boolean {
  switch (name) {
    case 'srcset':
      return isSafeSrcset(decodeCharacterReferences(value), schemes);
    case 'ping':
      return decodeCharacterReferences(value).split(/[ \t\n\f\r]+/).every(url => isSafeUrl(url, schemes));
    default:
      return !URL_ATTRIBUTES.has(name) || isSafeUrl(decodeCharacterReferences(value), schemes);
  }
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

  const scheme = SCHEME.exec(head)?.[1].toLowerCase();
  return scheme === undefined || schemes.has(scheme) || (scheme === 'data' && DATA_MEDIA_URL.test(cleaned));
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
  let position = 0;
  while (position < srcset.length) {
    const code = srcset.charCodeAt(position);
    // White spaces and `,` between the candidates
    if (isWhitespace(code) || code === 44) {
      position++;
      continue;
    }

    const start = position;
    while (position < srcset.length && !isWhitespace(srcset.charCodeAt(position))) {
      position++;
    }

    let url = srcset.slice(start, position);
    if (url.endsWith(',')) {
      url = url.replace(/,+$/, '');
    } else {
      position = skipDescriptors(srcset, position);
    }

    if (!isSafeUrl(url, schemes)) {
      return false;
    }
  }

  return true;
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

/**
 * Removes from a URL what the browser ignores: the control characters and the spaces at its ends, and the tabs and the
 * line breaks anywhere (`java\tscript:` is `javascript:`).
 *
 * @param url - The URL.
 * @returns The URL as the browser reads it.
 */
function cleanUrl(url: string): string {
  let start = 0;
  let end = url.length;
  while (start < end && url.charCodeAt(start) <= 32) {
    start++;
  }

  while (end > start && url.charCodeAt(end - 1) <= 32) {
    end--;
  }

  let cleaned = '';
  for (let i = start; i < end; i++) {
    const code = url.charCodeAt(i);
    if (code !== 9 && code !== 10 && code !== 13) {
      cleaned = `${cleaned}${url[i]}`;
    }
  }

  return cleaned;
}

/**
 * Skips the descriptors of a candidate of a `srcset` (`2x`, `640w`), up to the `,` ending it outside parentheses.
 *
 * @param srcset - The value of the attribute.
 * @param position - The position after the URL of the candidate.
 * @returns The position after the `,`, the length of the value without one.
 */
function skipDescriptors(srcset: string, position: number): number {
  let depth = 0;
  for (; position < srcset.length; position++) {
    switch (srcset.charCodeAt(position)) {
      // `(`
      case 40:
        depth++;
        break;
      // `)`
      case 41:
        depth = Math.max(0, depth - 1);
        break;
      // `,`
      case 44:
        if (depth === 0) {
          return position + 1;
        }

        break;
    }
  }

  return position;
}
