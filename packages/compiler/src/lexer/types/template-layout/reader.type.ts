/**
 * What the layout of a template is read from, and where it is read at.
 */
export type Reader = {
  /**
   * The text of the template.
   */
  readonly source: string;
  /**
   * The index of the next character to read.
   */
  position: number;
};
