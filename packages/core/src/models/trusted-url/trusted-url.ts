import type { SafeUrl } from '../../types/safe-url.type';

/**
 * A URL the application trusts (see `trustUrl` and `trustResourceUrl`). A class, not a plain object, so that `_checkUrl`
 * tells a URL marked by the application by `instanceof`, which no value read from a request or a JSON can be.
 */
export class TrustedUrl implements SafeUrl {
  /**
   * Creates the URL trusted.
   *
   * @param url - The URL.
   * @param resource - Whether it is trusted to load a resource into the page too.
   */
  constructor(public readonly url: string, public readonly resource: boolean) { }

  /**
   * Gives the URL, which an attribute bound to it is written with.
   *
   * @returns The URL.
   */
  public toString(): string {
    return this.url;
  }
}
