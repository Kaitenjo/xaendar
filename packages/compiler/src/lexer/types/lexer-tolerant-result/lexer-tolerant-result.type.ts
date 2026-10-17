import type { TemplateError } from '../../../models/template-error/template-error.model';
import type { LexerState } from '../lexer-state.enum';
import type { Token } from '../token.type';

/**
 * The result of tokenizing a template without stopping at an error (see `Lexer.tokenizeTolerant`), so that the part of
 * a template that cannot be tokenized as a whole (e.g. while the user is typing) can still be read.
 */
export type LexerTolerantResult = {
  /**
   * The tokens emitted: when the tokenization failed, the ones before the error.
   */
  tokens: Token[];
  /**
   * The state the lexer ended in, e.g. the attribute whose name the input stops in the middle of, or the one failing.
   */
  state: LexerState;
  /**
   * The error that stopped the tokenization, `undefined` when the input was tokenized up to its end, or up to the last token to lex.
   */
  error?: TemplateError;
};
