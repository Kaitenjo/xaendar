import { TokenType } from '../token-type.enum';
import type { TokenWithSpan } from '../token-with-span.type';

/**
 * Token emitted when the lexer encounters a `@catch` keyword.
 */
export type CatchToken = TokenWithSpan<{
  /**
   * Discriminant identifying this token as a catch keyword.
   */
  type: TokenType.CATCH
}>
