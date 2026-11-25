/**
 * The attributes holding a single URL, of HTML and of SVG: the ones the browser loads or opens.
 */
const URL_ATTRIBUTES: ReadonlySet<string> = new Set([
  'action', 'background', 'cite', 'codebase', 'data', 'dynsrc', 'formaction', 'href', 'icon', 'itemtype', 'longdesc',
  'lowsrc', 'manifest', 'poster', 'src', 'xlink:href'
]);

/**
 * The attributes holding a list of images, each with its URL (`srcset`).
 */
const IMAGE_LIST_ATTRIBUTES: ReadonlySet<string> = new Set(['imagesrcset', 'srcset']);

/**
 * The attributes of each element loading a resource into the page, as a document, a plugin, a stylesheet or the base of
 * the other URLs: what it loads runs with the page, so it must come from the application or from an origin it trusts,
 * as Angular checks its resource URLs.
 */
const RESOURCE_URL_ATTRIBUTES: ReadonlyMap<string, readonly string[]> = new Map([
  ['base', ['href']],
  ['embed', ['src']],
  ['frame', ['src']],
  ['iframe', ['src']],
  ['link', ['href']],
  ['object', ['codebase', 'data']]
]);

/**
 * The beginning of a URL without scheme that is not relative to the page: `//host`, or one written with backslashes,
 * which the browser reads as slashes (`/\host`).
 */
const SCHEME_RELATIVE = /^[/\\]{2}/;

/**
 * The white spaces separating the URLs of a list (`ping`).
 */
const URL_SEPARATOR = /[ \t\n\f\r]+/;

/**
 * The URLs `data:` of an image, an audio or a video in base64, which run no code (an SVG image, which can, is not among
 * them).
 */
const DATA_MEDIA_URL = /^data:(?:image[/](?:avif|bmp|gif|jpeg|jpg|png|tiff|webp)|video[/](?:mpeg|mp4|ogg|webm)|audio[/](?:mp3|mpeg|oga|ogg|opus|wav));base64,[a-z0-9+/]+=*$/i;

/**
 * The scheme of a URL: letters, digits, `+`, `-` and `.` after a letter, up to a `:`.
 */
const SCHEME = /^([a-z][a-z0-9+.-]*):/i;

/**
 * Tells whether an attribute holds a single URL the browser loads or opens (`href`, `src`, `action`…).
 *
 * @param name - The name of the attribute, lowercase.
 * @returns `true` for an attribute holding a URL.
 */
export function isUrlAttribute(name: string): boolean {
  return URL_ATTRIBUTES.has(name);
}

/**
 * Removes from a URL what the browser ignores: the control characters and the spaces at its ends, and the tabs and the
 * line breaks anywhere (`java\tscript:` is `javascript:`).
 *
 * @param url - The URL.
 * @returns The URL as the browser reads it.
 */
export function cleanUrl(url: string): string {
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
 * Reads the scheme of a URL as the browser reads it (see {@link cleanUrl}).
 *
 * @param url - The URL, cleaned.
 * @returns The scheme, lowercase, `undefined` for a relative URL.
 */
export function readUrlScheme(url: string): string | undefined {
  return SCHEME.exec(url)?.[1].toLowerCase();
}

/**
 * Tells whether a URL `data:` holds an image, an audio or a video in base64, which runs no code.
 *
 * @param url - The URL, cleaned (see {@link cleanUrl}).
 * @returns `true` for the media `data:` URLs.
 */
export function isMediaDataUrl(url: string): boolean {
  return DATA_MEDIA_URL.test(url);
}

/**
 * Tells whether a URL runs code where the browser loads or opens it: a `javascript:` or `vbscript:` URL, or a `data:`
 * URL that is not an image, an audio or a video in base64 (an HTML or an SVG document). Any other scheme, and a relative
 * URL, is safe. The URL is read as the browser reads it (see {@link cleanUrl}).
 *
 * @param url - The URL, as an attribute holds it.
 * @returns `true` for a URL running code.
 */
export function isUnsafeUrl(url: string): boolean {
  const cleaned = cleanUrl(url);
  switch (readUrlScheme(cleaned)) {
    case 'javascript':
    case 'vbscript':
      return true;

    case 'data':
      return !isMediaDataUrl(cleaned);

    default:
      return false;
  }
}

/**
 * Tells whether an attribute holds URLs the browser loads or opens: a single one (see {@link isUrlAttribute}), a list
 * of images (`srcset`, `imagesrcset`) or a list of URLs separated by white spaces (`ping`).
 *
 * @param name - The name of the attribute, lowercase.
 * @returns `true` for an attribute holding one or more URLs.
 */
export function holdsUrls(name: string): boolean {
  return URL_ATTRIBUTES.has(name) || IMAGE_LIST_ATTRIBUTES.has(name) || name === 'ping';
}

/**
 * Tells whether the value of an attribute holding URLs (see {@link holdsUrls}) holds one running code (see
 * {@link isUnsafeUrl}): any image of a `srcset`, any URL of a `ping`, the value itself for the others.
 *
 * @param name - The name of the attribute, lowercase.
 * @param value - The value of the attribute.
 * @returns `true` when a URL of the value runs code.
 */
export function holdsUnsafeUrl(name: string, value: string): boolean {
  if (IMAGE_LIST_ATTRIBUTES.has(name)) {
    return !everySrcsetUrl(value, url => !isUnsafeUrl(url));
  }

  return name === 'ping' ? value.split(URL_SEPARATOR).some(isUnsafeUrl) : isUnsafeUrl(value);
}

/**
 * Tells whether every image of a `srcset` passes a test. The candidates are read as the browser reads them: a URL up to
 * a white space, a URL ending with `,` ending its candidate, otherwise the descriptors (`2x`, `640w`) up to the next `,`
 * outside parentheses.
 *
 * @param srcset - The value of the attribute.
 * @param test - The test of a URL.
 * @returns `true` when the test passes for the URL of every image.
 */
export function everySrcsetUrl(srcset: string, test: (url: string) => boolean): boolean {
  let position = 0;
  while (position < srcset.length) {
    const code = srcset.charCodeAt(position);
    // White spaces and `,` between the candidates
    if (isHtmlWhitespace(code) || code === 44) {
      position++;
      continue;
    }

    const start = position;
    while (position < srcset.length && !isHtmlWhitespace(srcset.charCodeAt(position))) {
      position++;
    }

    let url = srcset.slice(start, position);
    if (url.endsWith(',')) {
      url = url.replace(/,+$/, '');
    } else {
      position = skipDescriptors(srcset, position);
    }

    if (!test(url)) {
      return false;
    }
  }

  return true;
}

/**
 * Tells whether an attribute of an element loads a resource into the page (`src` of an `<iframe>`, `<embed>` or
 * `<frame>`, `data` and `codebase` of an `<object>`, `href` of a `<link>` or of the `<base>`): a document, a plugin or a
 * stylesheet running with the page, which must come from the application or from an origin it trusts (see
 * {@link isUntrustedResourceUrl}).
 *
 * @param tagName - The tag name of the element, lowercase.
 * @param name - The name of the attribute, lowercase.
 * @returns `true` for an attribute loading a resource.
 */
export function isResourceUrlAttribute(tagName: string, name: string): boolean {
  return RESOURCE_URL_ATTRIBUTES.get(tagName)?.includes(name) === true;
}

/**
 * Tells whether a URL loads a resource from outside the application: an absolute URL, `//host` included, whose origin is
 * not one of the trusted ones, a URL running code (`javascript:`, `data:`), whose origin is none, included. A relative
 * URL loads from the origin of the page, and is trusted. The URL is read as the browser reads it (see {@link cleanUrl}).
 *
 * @param url - The URL, as an attribute holds it.
 * @param trustedOrigins - The origins trusted, as `URL.origin` writes them (`https://cdn.example.com`).
 * @returns `true` for a URL loading from an origin that is not trusted.
 */
export function isUntrustedResourceUrl(url: string, trustedOrigins: readonly string[]): boolean {
  const cleaned = cleanUrl(url);
  const schemeRelative = SCHEME_RELATIVE.test(cleaned);
  if (!schemeRelative && readUrlScheme(cleaned) === undefined) {
    return false;
  }

  return !trustedOrigins.includes(readUrlOrigin(schemeRelative ? `https:${cleaned}` : cleaned));
}

/**
 * Reads the origin of an absolute URL, as `URL.origin` writes it: `'null'` for a URL without one (`javascript:`,
 * `data:`) or that cannot be read.
 *
 * @param url - The absolute URL.
 * @returns The origin.
 */
export function readUrlOrigin(url: string): string {
  try {
    return new URL(url).origin;
  } catch {
    return 'null';
  }
}

/**
 * Tells whether a character is a white space of HTML, which separates the candidates of a `srcset`.
 *
 * @param code - The code of the character.
 * @returns `true` for a space, a tab, a line feed, a form feed or a carriage return.
 */
function isHtmlWhitespace(code: number): boolean {
  return code === 32 || code === 9 || code === 10 || code === 12 || code === 13;
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
