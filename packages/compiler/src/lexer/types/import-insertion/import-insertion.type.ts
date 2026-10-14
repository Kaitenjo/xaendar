import type { Span } from '../../../types/span.type';

/**
 * The change of a template that imports a symbol.
 */
export type ImportInsertion = {
  /**
   * The span of the template the text replaces: empty when the text is only inserted.
   */
  readonly span: Span;
  /**
   * The text to insert: a new `@import` statement, or the symbol added to the statement importing from the same module.
   */
  readonly newText: string;
};
