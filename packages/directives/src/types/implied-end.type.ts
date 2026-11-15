/**
 * The elements a start tag closes when they are open, as the HTML parser does (an `li` closes the `li` before it).
 */
export interface ImpliedEnd {
  /**
   * The elements the start tag closes: the nearest one open, with the elements opened inside it.
   */
  readonly closes: ReadonlySet<string>;
  /**
   * The elements the search for the one to close stops at, `null` when only the current element can be closed (a heading
   * closing the heading it is in).
   */
  readonly scope: ReadonlySet<string> | null;
}
