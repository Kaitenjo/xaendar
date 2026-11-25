/**
 * The lists of the options of the HTML sanitizer that could keep what always runs code (see
 * `describeUnsafeSanitizerOptions`): the `HtmlSanitizerOptions` of `@@innerHtml`, and the `html` of the security of
 * `xaendar.json`.
 */
export interface SanitizerOptionLists {
  /**
   * The elements kept besides the default ones.
   */
  readonly allowElements?: readonly string[];
  /**
   * The attributes kept besides the default ones, `element[attribute]` for one element only.
   */
  readonly allowAttributes?: readonly string[];
  /**
   * The schemes of the URLs kept, in place of the default ones.
   */
  readonly urlSchemes?: readonly string[];
}
