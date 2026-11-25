import { holdsUnsafeUrl, holdsUrls, isResourceUrlAttribute, isUntrustedResourceUrl } from '@xaendar/internals';
import { TrustedUrl } from '../../models/trusted-url/trusted-url';
import type { _UrlCheck } from '../../types/url-check.type';
import { DEV_MODE } from '../dev-mode/dev-mode.util';
import { SECURITY } from '../security/security.util';

/**
 * Checks the value bound to an attribute holding URLs (`href`, `src`, `srcset`, `ping`…), on the client and on the
 * server, as the `security` of the project asks (see `SECURITY`), whoever compiled the template, the project or one of
 * its libraries: the compiler only tells which attributes hold URLs.
 * - The `urls` of `security`: a URL running code (`javascript:`, `vbscript:`, a `data:` URL that is not a media, see
 *   `holdsUnsafeUrl`) is written with a warning (`'warn'`), or left out (`'remove'`).
 * - The `resourceUrls` of `security`, for an attribute loading a resource into the page (the `src` of an `<iframe>`…):
 *   an absolute URL whose origin is not one of the `trustedOrigins` (see `isUntrustedResourceUrl`), the same way.
 *
 * Nothing is checked for an option `'off'`. The warning of a URL left out is logged in development only. `null`,
 * `undefined` and the booleans are no URL, and pass; a URL marked with `trustResourceUrl` passes both checks, one marked
 * with `trustUrl` the first one.
 *
 * @param name - The name of the attribute.
 * @param value - The value bound to it.
 * @param resource - Whether the attribute loads a resource into the page, whose origin is checked too.
 * @returns The value, `null` for a URL left out.
 */
export function _checkUrl(name: string, value: unknown, resource?: boolean): unknown {
  if (value === null || value === undefined || typeof value === 'boolean') {
    return value;
  }

  const trusted = value instanceof TrustedUrl ? value : undefined;
  if (trusted?.resource) {
    return value;
  }

  const text = String(value);
  const { urls, resourceUrls } = SECURITY;
  if (urls !== 'off' && !trusted && holdsUnsafeUrl(name.toLowerCase(), text)) {
    return reject(name, value, urls, `runs code (${text})`, 'Bind a URL of the application, or mark it with trustUrl() when the application trusts it', 'urls');
  }

  if (resource && resourceUrls !== 'off' && isUntrustedResourceUrl(text, SECURITY.trustedOrigins)) {
    return reject(name, value, resourceUrls, `loads a resource from an origin the application does not trust (${text})`, 'Bind a URL of the application, add its origin to "trustedOrigins", or mark it with trustResourceUrl() when the application trusts it', 'resourceUrls');
  }

  return value;
}

/**
 * Checks the value a `@HostAttribute` writes into an attribute of its element, as `_checkUrl` checks the ones of the
 * templates: an attribute holding URLs, and the origin of one loading a resource on the element.
 *
 * @param element - The element.
 * @param name - The name of the attribute.
 * @param value - The value the member gives.
 * @returns The value, `null` for a URL left out.
 */
export function checkHostUrl(element: Element, name: string, value: unknown): unknown {
  const lowerCase = name.toLowerCase();
  return holdsUrls(lowerCase) ? _checkUrl(name, value, isResourceUrlAttribute(element.localName, lowerCase)) : value;
}

/**
 * Applies the check a URL failed: writes it with a warning (`'warn'`), or leaves it out (`'remove'`), with the warning
 * in development only.
 *
 * @param name - The name of the attribute.
 * @param value - The value bound to it.
 * @param check - What to do with the URL.
 * @param problem - What the URL does, written after `the URL bound to <name>`.
 * @param fix - What to do instead.
 * @param option - The option of `security` asking for the check.
 * @returns The value for `'warn'`, `null` for `'remove'`.
 */
function reject(name: string, value: unknown, check: _UrlCheck, problem: string, fix: string, option: 'urls' | 'resourceUrls'): unknown {
  if (check === 'warn') {
    console.warn(`Xaendar: the URL bound to ${name} ${problem}: it is written as it is. ${fix}, or set "security": { "${option}": "remove" } in xaendar.json to leave it out.`);
    return value;
  }

  if (DEV_MODE) {
    console.warn(`Xaendar: the URL bound to ${name} ${problem}: ${name} is left out, as "security": { "${option}": "remove" } in xaendar.json asks.`);
  }

  return null;
}
