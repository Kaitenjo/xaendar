/**
 * The state of a scan of an expression.
 */
export type ScanState = {
  /**
   * The constructs open at the scanned character, innermost last: parentheses, brackets, braces (`{` or `${`) and
   * template literals.
   */
  readonly nesting: string[];
  /**
   * The quote of the string literal the scanned character is in, if any.
   */
  quote: string | undefined;
};
