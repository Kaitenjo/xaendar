import type { Span } from '../../types/span.type';

/**
 * Where the path of the module of an `@import` statement is being written, between its quotes.
 */
export type ImportPathContext = {
  /**
   * The part of the path before the segment being written, slash included (empty for the first segment).
   */
  readonly directory: string;
  /**
   * The span of the segment being written, up to the next slash or the closing quote, empty when nothing is written yet.
   */
  readonly span: Span;
};
