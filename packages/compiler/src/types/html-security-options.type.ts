/**
 * The `html` of the `security` of `xaendar.json`: the options of the sanitizer of `@@innerHtml` and `sanitizeHtml` of
 * `@xaendar/directives` for every HTML the project sanitizes. A use passing its own options adds its lists to these, and
 * its `urlSchemes` replace these. The build rejects options keeping what always runs code (see `findHtmlSecurityError`).
 */
export interface HtmlSecurityOptions {
  /**
   * The elements kept besides the default ones, a name ending with `*` for a prefix.
   */
  readonly allowElements?: readonly string[];
  /**
   * The attributes kept besides the default ones, `element[attribute]` for one element only.
   */
  readonly allowAttributes?: readonly string[];
  /**
   * The elements removed, their content kept.
   */
  readonly removeElements?: readonly string[];
  /**
   * The attributes removed, `element[attribute]` for one element only.
   */
  readonly removeAttributes?: readonly string[];
  /**
   * The schemes of the URLs kept, in place of the default ones (`http`, `https`, `mailto`, `tel`, `ftp`, `sms`).
   */
  readonly urlSchemes?: readonly string[];
}
