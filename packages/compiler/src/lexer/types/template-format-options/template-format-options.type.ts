/**
 * How a template is formatted.
 */
export type TemplateFormatOptions = {
  /**
   * The text of one level of indentation: spaces, or a tab.
   */
  readonly indent: string;
  /**
   * The width of one level of indentation in columns, to measure the lines that are indented with tabs.
   */
  readonly indentWidth: number;
  /**
   * The width, in columns, a line should stay within: the opening tags that don't fit are written one item per line.
   */
  readonly printWidth: number;
};
