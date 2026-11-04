import { TokenType } from '../token-type.enum';
import type { TokenWithSpan } from '../token-with-span.type';

/**
 * Token emitted when the lexer encounters an `@else if` keyword.
 */
export type ElseIfToken = TokenWithSpan<{
  /**
   * Discriminant identifying this token as an else if keyword.
   */
  type: TokenType.ELSE_IF
}>
