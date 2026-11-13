import { TokenType } from '../token-type.enum';
import type { TokenWithSpan } from '../token-with-span.type';

/**
 * Token emitted when the lexer encounters an `@empty` keyword.
 */
export type EmptyToken = TokenWithSpan<{
  /**
   * Discriminant identifying this token as an empty keyword.
   */
  type: TokenType.EMPTY
}>
