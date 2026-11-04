import { TokenType } from '../token-type.enum';
import type { TokenWithSpan } from '../token-with-span.type';

/**
 * Token emitted when the lexer encounters an `@else` keyword.
 */
export type ElseToken = TokenWithSpan<{
  /**
   * Discriminant identifying this token as an else keyword.
   */
  type: TokenType.ELSE
}>
