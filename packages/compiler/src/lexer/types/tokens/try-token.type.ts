import { TokenType } from '../token-type.enum';
import type { TokenWithSpan } from '../token-with-span.type';

/**
 * Token emitted when the lexer encounters a `@try` keyword.
 */
export type TryToken = TokenWithSpan<{
  /**
   * Discriminant identifying this token as a try keyword.
   */
  type: TokenType.TRY
}>
