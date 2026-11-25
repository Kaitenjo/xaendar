import { TrustedUrl } from '../../models/trusted-url/trusted-url';
import type { SafeResourceUrl } from '../../types/safe-resource-url.type';
import type { SafeUrl } from '../../types/safe-url.type';

/**
 * Marks a URL as trusted: bound to an attribute holding URLs (`href`, `src`, `srcset`…), in a template or by a
 * `@HostAttribute`, it is written as it is, even when it runs code (`javascript:`), without the check `urls` of the
 * `security` of `xaendar.json` asks for. Where it loads a resource into the page (the `src` of an `<iframe>`…) it is
 * still checked as `resourceUrls` asks: mark it with `trustResourceUrl` there. The equivalent of
 * `bypassSecurityTrustUrl` of Angular.
 *
 * Use it only for a URL the application builds, or that comes from a source it trusts: calling it where the URL is
 * built, rather than turning the check off, keeps every trusted URL easy to find.
 *
 * @example
 * ```ts
 * public readonly bookmarklet = trustUrl('javascript:void(window.print())');
 * ```
 *
 * @param url - The URL to trust.
 * @returns The URL, marked as trusted.
 */
export function trustUrl(url: string): SafeUrl {
  return new TrustedUrl(url, false);
}

/**
 * Marks a URL as trusted to load a resource into the page: bound to any attribute holding URLs, the `src` of an
 * `<iframe>`, the `data` of an `<object>` or the `href` of a `<link>` included, it is written as it is, without the
 * checks `urls` and `resourceUrls` of the `security` of `xaendar.json` ask for, whatever its origin. The equivalent of
 * `bypassSecurityTrustResourceUrl` of Angular.
 *
 * Use it only for a URL the application builds, or that comes from a source it trusts; an origin the application always
 * loads from is better listed once in the `trustedOrigins` of `xaendar.json`.
 *
 * @example
 * ```ts
 * public readonly map = computed(() => trustResourceUrl(`https://maps.example.com/embed?q=${encodeURIComponent(this.place())}`));
 * ```
 *
 * @param url - The URL to trust.
 * @returns The URL, marked as trusted to load a resource.
 */
export function trustResourceUrl(url: string): SafeResourceUrl {
  return new TrustedUrl(url, true) as SafeResourceUrl;
}
