/**
 * The rows a content is written in, as it is built.
 */
export type ContentLayout = {
  /**
   * The rows, without their indentation. The first one follows what opens the content, unless {@link leadingBreak}.
   */
  readonly rows: string[];
  /**
   * Whether the content starts on a new line, after what opens it.
   */
  readonly leadingBreak: boolean;
  /**
   * Whether what closes the content is on a new line.
   */
  readonly trailingBreak: boolean;
  /**
   * Whether a line break can be written between what opens the content and the content, without changing the template.
   */
  readonly canBreakStart: boolean;
  /**
   * Whether a line break can be written between the content and what closes it, without changing the template.
   */
  readonly canBreakEnd: boolean;
};
