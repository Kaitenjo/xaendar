/**
 * The attributes holding a single URL, of HTML and of SVG: the ones the browser loads or opens.
 */
const URL_ATTRIBUTES: ReadonlySet<string> = new Set([
  'action', 'background', 'cite', 'codebase', 'data', 'dynsrc', 'formaction', 'href', 'icon', 'itemtype', 'longdesc',
  'lowsrc', 'manifest', 'poster', 'src', 'xlink:href'
]);

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
