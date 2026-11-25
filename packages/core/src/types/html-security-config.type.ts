/**
 * The `html` of the `security` of `xaendar.json` (see `_SecurityConfig`): the options of the sanitizer of `@@innerHtml`
 * and `sanitizeHtml` for every HTML the project sanitizes, joined with the options a use passes. Shaped as the
 * `HtmlSanitizerOptions` of `@xaendar/directives`, which core does not depend on.
 */
export type _HtmlSecurityConfig = {
  /**
   * The elements kept besides the default ones.
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
   * The schemes of the URLs kept, in place of the default ones.
   */
  readonly urlSchemes?: readonly string[];
};
