/**
 * Returns the path of a URL, or of the target of an HTTP request, with its query string, starting with a single slash:
 * resolved against any base, it keeps the origin of the base.
 *
 * A URL starting with slashes or backslashes is a path, whose first segment is never read as a host: `//about` is
 * `/about`. Any other URL is parsed as the browser parses it, so the origin and the fragment are dropped, the tabs and
 * the line feeds removed, the backslashes read as slashes and the dot segments resolved. A path that would still start
 * with `//`, which would be read as a URL of another origin, keeps a single slash. A URL that cannot be parsed gives `/`.
 *
 * @param url - The URL, absolute or relative, or the target of an HTTP request, as `request.url` of Node gives it.
 * @returns The path, with the query string.
 *
 * @example
 * toSameOriginPath('/search?q=tea#results');     // '/search?q=tea'
 * toSameOriginPath('https://example.com/a/../b'); // '/b'
 * toSameOriginPath('//evil.com/x');               // '/evil.com/x'
 * toSameOriginPath('http://[');                   // '/'
 */
export function toSameOriginPath(url: string): string {
  // Any origin does: only the path and the query string are kept
  const base = 'http://localhost';
  // The parser would read the first segment of //about as a host
  const path = url.replace(/^[\s/\\]+/, '/');
  if (!URL.canParse(path, base)) {
    return '/';
  }

  const { pathname, search } = new URL(path, base);
  // The dot segments can still give a path starting with //, as /..//evil.com does
  return `${pathname.replace(/^\/+/, '/')}${search}`;
}
