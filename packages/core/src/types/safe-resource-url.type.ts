import type { SafeUrl } from './safe-url.type';

/**
 * A URL the application trusts to load a resource into the page, created with `trustResourceUrl`: bound to an attribute,
 * it is written as it is, wherever it is. The equivalent of the `SafeResourceUrl` of Angular.
 */
export interface SafeResourceUrl extends SafeUrl {
  /**
   * Always `true`: the URL is trusted to load a resource too.
   */
  readonly resource: true;
}
