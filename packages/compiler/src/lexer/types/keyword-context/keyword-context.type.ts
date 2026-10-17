import type { Span } from '../../../types/span.type';

/**
 * Where the keyword of a block (`@if`, `@for`, `@import`…) is being written, after a `@`.
 */
export type KeywordContext = {
  /**
   * The keywords that can be written there, without the `@`: the ones of the blocks of the template content and `render`, or of
   * the conditional bindings among the bindings of a tag, `else` and `else if` right after an `@if` block, only
   * `case` and `default` in a `@switch` block, `import` before anything else.
   */
  readonly keywords: readonly ('if' | 'else' | 'else if' | 'for' | 'switch' | 'case' | 'default' | 'import' | 'render')[];
  /**
   * The span of the `@` and of the part of the keyword written so far.
   */
  readonly span: Span;
};
