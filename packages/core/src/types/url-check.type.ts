/**
 * What the runtime does with a URL running code bound to an attribute holding a URL (see `_checkUrl`), as the
 * `security.urls` of `xaendar.json` asks: `'warn'` writes it and logs a warning, `'remove'` leaves the attribute out,
 * logging the warning in development.
 */
export type _UrlCheck = 'warn' | 'remove';
