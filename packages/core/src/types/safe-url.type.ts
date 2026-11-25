/**
 * A URL the application trusts, created with `trustUrl` or `trustResourceUrl`: bound to an attribute, it is written as
 * it is, without the checks the `security` of `xaendar.json` asks for. The equivalent of the `SafeUrl` of Angular.
 */
export interface SafeUrl {
  /**
   * The URL trusted.
   */
  readonly url: string;
  /**
   * Whether the URL is trusted to load a resource into the page too (see `trustResourceUrl`): a URL trusted with
   * `trustUrl` is still checked where it loads a resource.
   */
  readonly resource: boolean;
  /**
   * Gives the URL, which an attribute bound to it is written with.
   *
   * @returns The URL.
   */
  toString(): string;
}
