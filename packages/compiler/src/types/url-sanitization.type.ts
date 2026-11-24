/**
 * How the URLs a template binds to the attributes loading or opening them (`href`, `src`, `action`…) are checked, on the
 * client and on the server (see `SecurityOptions['urls']`): `'off'` writes them as they are, `'warn'` writes them and
 * logs a warning for a URL running code (`javascript:`), `'remove'` leaves the attribute out and logs the warning.
 */
export type UrlSanitization = 'off' | 'warn' | 'remove';
