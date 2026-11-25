import type { _HtmlSecurityConfig } from './html-security-config.type';
import type { _UrlCheck } from './url-check.type';

/**
 * The `security` of `xaendar.json` the runtime applies (see `SECURITY`): to the `@HostAttribute` of the components and
 * of the directives, which no template compiles, and the trusted origins to every resource URL checked.
 */
export type _SecurityConfig = {
  /**
   * How the URLs written into the attributes holding them are checked (see `_checkUrl`), `'off'` for not at all.
   */
  readonly urls: 'off' | _UrlCheck;
  /**
   * How the URLs written into the attributes loading a resource are checked (see `_checkUrl`), `'off'` for not at all.
   */
  readonly resourceUrls: 'off' | _UrlCheck;
  /**
   * The origins a resource may be loaded from besides the one of the application, as `URL.origin` writes them.
   */
  readonly trustedOrigins: readonly string[];
  /**
   * Whether a `@HostAttribute` writing an attribute the browser runs, or one lifting a restriction, throws.
   */
  readonly rejectUnsafeBindings: boolean;
  /**
   * The options of the sanitizer of `@@innerHtml` and `sanitizeHtml` for the whole project, absent when it sets none.
   */
  readonly html?: _HtmlSecurityConfig;
};
