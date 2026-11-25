/**
 * How the URLs a template binds to the attributes loading or opening them (`href`, `src`, `action`…) are checked, on the
 * client and on the server (see `SecurityOptions['urls']` and `SecurityOptions['resourceUrls']`): `'off'` writes them as
 * they are, `'warn'` writes them and logs a warning for a URL that is not safe, `'remove'` leaves the attribute out and
 * logs the warning in development. A URL marked with `trustUrl` or `trustResourceUrl` of `@xaendar/core` always passes.
 */
export type UrlSanitization = 'off' | 'warn' | 'remove';
