import { TokenType } from '../token-type.enum';
import { TokenWithSpan } from '../token.type';

/**
 * Token emitted when the lexer encounters a `@let` keyword, which declares a template variable.
 */
export type LetToken = TokenWithSpan<{
  /**
   * Discriminant identifying this token as a let keyword.
   */
  type: TokenType.LET
}>
