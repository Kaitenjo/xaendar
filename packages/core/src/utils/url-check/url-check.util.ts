import { isUnsafeUrl } from '@xaendar/internals';
import type { _UrlCheck } from '../../types/url-check.type';
import { DEV_MODE } from '../dev-mode/dev-mode.util';

/**
 * Checks the value a template binds to an attribute holding a URL (`href`, `src`, `action`…), on the client and on the
 * server, when the `security.urls` of `xaendar.json` asks for it: a URL running code (`javascript:`, `vbscript:`, a
 * `data:` URL that is not a media, see `isUnsafeUrl`) is written with a warning (`'warn'`), or left out (`'remove'`),
 * the warning logged in development only. `null`, `undefined` and the booleans are no URL, and pass.
 *
 * @param name - The name of the attribute.
 * @param value - The value bound to it.
 * @param check - What to do with a URL running code.
 * @returns The value, `null` for a URL left out.
 */
export function _checkUrl(name: string, value: unknown, check: _UrlCheck): unknown {
  if (value === null || value === undefined || typeof value === 'boolean') {
    return value;
  }

  const url = String(value);
  if (!isUnsafeUrl(url)) {
    return value;
  }

  if (check === 'warn') {
    console.warn(`Xaendar: the URL bound to ${name} runs code (${url}): it is written as it is. Bind a URL of the application, or set "security": { "urls": "remove" } in xaendar.json to leave it out.`);
    return value;
  }

  if (DEV_MODE) {
    console.warn(`Xaendar: the URL bound to ${name} runs code (${url}): ${name} is left out, as "security": { "urls": "remove" } in xaendar.json asks.`);
  }

  return null;
}
