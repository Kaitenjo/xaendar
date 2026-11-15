/**
 * What the sanitizer removed from an HTML: the detail of the `sanitized` event of `@@innerHtml`.
 */
export interface HtmlSanitizeReport {
  /**
   * The names of the elements removed, each once, in the order they were met: the ones whose content is kept as well as
   * the ones removed with their content.
   */
  readonly removedElements: readonly string[];
  /**
   * The attributes removed, each once, in the order they were met, as `element[attribute]` (`img[onerror]`): the ones not
   * allowed, and the ones holding a URL that is not allowed (`a[href]`).
   */
  readonly removedAttributes: readonly string[];
}
