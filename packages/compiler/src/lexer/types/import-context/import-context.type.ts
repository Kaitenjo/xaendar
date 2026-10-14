import type { Span } from '../../../types/span.type';

/**
 * Where a symbol is being written between the braces of an `@import` statement.
 */
export type ImportContext = {
  /**
   * The path of the module the statement imports from, as written in the statement.
   */
  readonly path: string;
  /**
   * The span of the symbol being written, empty when nothing is written yet.
   */
  readonly span: Span;
  /**
   * The symbols the statement already imports, the one being written excluded.
   */
  readonly imported: readonly string[];
};
