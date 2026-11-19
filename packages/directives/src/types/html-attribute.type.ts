/**
 * An attribute of a start tag, as `HtmlTokenizer` reads it.
 */
export interface HtmlAttribute {
  /**
   * The name of the attribute, its ASCII letters lowercase.
   */
  readonly name: string;
  /**
   * The value of the attribute as it is written, its character references not decoded: `''` without value.
   */
  readonly value: string;
}
