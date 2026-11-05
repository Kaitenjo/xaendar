import { TokenType } from '../token-type.enum';
import type { TokenWithSpan } from '../token-with-span.type';

/**
 * Token emitted when the lexer encounters an `@error` keyword.
 */
export type ErrorToken = TokenWithSpan<{
  /**
   * Discriminant identifying this token as an error keyword.
   */
  type: TokenType.ERROR
}>
