/**
 * The names of the elements or of the attributes the sanitizer keeps (see `HtmlSanitizerOptions`).
 */
export interface HtmlNamePolicy {
  /**
   * The names kept.
   */
  readonly allowed: ReadonlySet<string>;
  /**
   * The prefixes of the names kept (`data-` of `data-*`), `null` when there are none.
   */
  readonly allowedPrefixes: readonly string[] | null;
  /**
   * The names removed although allowed, `null` when there are none.
   */
  readonly removed: ReadonlySet<string> | null;
  /**
   * The prefixes of the names removed although allowed, `null` when there are none.
   */
  readonly removedPrefixes: readonly string[] | null;
}
