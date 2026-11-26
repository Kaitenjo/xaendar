import { isUnsafeUrl, isUntrustedResourceUrl } from '@xaendar/internals';
import { TrustedUrl } from '../../models/trusted-url/trusted-url';
import type { SafeUrl } from '../../types/safe-url.type';
import { SECURITY } from '../security/security.util';

/**
 * Checks a URL the application is about to use outside of a template, as a redirect (`location.href`), a `window.open`
 * or an attribute written by its own code: the URL itself when it runs no code, `null` when it does (`javascript:`,
 * `vbscript:`, a `data:` URL that is not an image, an audio or a video). The check a template applies to the URLs it
 * binds (see `urls` of the `security` of `xaendar.json`), made always, whatever `urls` asks: calling it is asking for
 * it. The equivalent of `sanitize(SecurityContext.URL, url)` of the `DomSanitizer` of Angular, which prefixes an unsafe
 * URL with `unsafe:` instead.
 *
 * A URL marked with `trustUrl` or `trustResourceUrl` is given back as it is.
 *
 * @example
 * ```ts
 * sanitizeUrl('/orders/42');              // '/orders/42'
 * sanitizeUrl('javascript:alert(1)');     // null
 * const target = sanitizeUrl(returnUrl);
 * if (target !== null) {
 *   location.href = target;
 * }
 * ```
 *
 * @param url - The URL, or a URL the application trusts.
 * @returns The URL, `null` when it runs code.
 */
export function sanitizeUrl(url: string | SafeUrl): string | null {
  const text = String(url);
  return url instanceof TrustedUrl || !isUnsafeUrl(text) ? text : null;
}

/**
 * Checks a URL the application is about to load into the page outside of a template, as the `src` of a frame its own
 * code creates: the URL itself when it runs no code (see {@link sanitizeUrl}) and loads from the application (a relative
 * URL) or from one of the `trustedOrigins` of the `security` of `xaendar.json`, `null` otherwise. The check a template
 * applies to the `src` of an `<iframe>`, the `data` of an `<object>`… (see `resourceUrls`), made always, whatever
 * `resourceUrls` asks. The equivalent of `sanitize(SecurityContext.RESOURCE_URL, url)` of the `DomSanitizer` of
 * Angular, which throws for any URL not marked instead.
 *
 * A URL marked with `trustResourceUrl` is given back as it is; one marked with `trustUrl` has its origin checked, as in
 * a template.
 *
 * @example
 * ```ts
 * sanitizeResourceUrl('/embed/42');                           // '/embed/42'
 * sanitizeResourceUrl('https://evil.example.net/frame.html'); // null, unless the origin is trusted
 * ```
 *
 * @param url - The URL, or a URL the application trusts.
 * @returns The URL, `null` when it runs code or loads from an origin the application does not trust.
 */
export function sanitizeResourceUrl(url: string | SafeUrl): string | null {
  const text = String(url);
  const trusted = url instanceof TrustedUrl;
  if (trusted && url.resource) {
    return text;
  }

  return (trusted || !isUnsafeUrl(text)) && !isUntrustedResourceUrl(text, SECURITY.trustedOrigins) ? text : null;
}
