import type { Span } from '../../types/span.type';

/**
 * Where the keyword of a block (`@if`, `@for`, `@import`…) is being written, after a `@`.
 */
export type KeywordContext = {
  /**
   * The keywords that can be written there, without the `@`: the ones of the blocks of the template content, `render` and `let`, or of
   * the conditional bindings among the bindings of a tag, `else` and `else if` right after an `@if` block,
   * `placeholder` right after a `@client` block, only `catch` right after a `@try` block, the ones among `placeholder`,
   * `loading` and `error` not written yet right after a `@defer` block or one of them, only `case` and `default` in a
   * `@switch` block, `import` before anything else.
   */
  readonly keywords: readonly ('if' | 'else' | 'else if' | 'for' | 'empty' | 'switch' | 'case' | 'default' | 'hydrate' | 'client' | 'placeholder' | 'try' | 'catch' | 'defer' | 'loading' | 'error' | 'import' | 'render' | 'let')[];
  /**
   * The span of the `@` and of the part of the keyword written so far.
   */
  readonly span: Span;
  /**
   * Whether `placeholder` is proposed as the one of a `@client`, a block of the rendering on the server, instead of the
   * one of a `@defer`.
   */
  readonly clientPlaceholder?: boolean;
};
