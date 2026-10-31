/**
 * A section of an `@for` expression, delimited by semicolons.
 */
export type ForSection = {
  /**
   * The text of the section, without the `;` separators and the leading spaces.
   */
  text: string;
  /**
   * The offset of the section in the template.
   */
  offset: number;
};
