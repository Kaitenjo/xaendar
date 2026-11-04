/**
 * An `@import` statement of the header of a template, read from its source.
 */
export type ImportStatement = {
  /**
   * The offset the statement starts at, on its `@import` keyword.
   */
  readonly start: number;
  /**
   * The offset the statement ends at, after its `;` if it has one.
   */
  readonly end: number;
  /**
   * The path of the module, as written.
   */
  readonly path: string;
  /**
   * The specifiers between the braces as written (`A`, `A as B`), the empty ones left by a trailing comma excluded.
   */
  readonly specifiers: string[];
  /**
   * Whether the statement is `@import lazy`.
   */
  readonly lazy: boolean;
  /**
   * The quote of the path.
   */
  readonly quote: string;
  /**
   * The `;` closing the statement, empty if it has none.
   */
  readonly semicolon: string;
  /**
   * Whether the specifiers are written on several lines.
   */
  readonly multiline: boolean;
  /**
   * The comments written after the statement, as written with the whitespace before them: the ones up to the next
   * statement, or the ones on the line of the last statement. Empty when there are none.
   */
  comments: string;
};
