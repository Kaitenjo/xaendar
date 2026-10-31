import { TokenType } from '../token-type.enum';
import type { TokenWithSpan } from '../token-with-span.type';

/**
 * Token emitted when the lexer encounters a `@default` keyword inside a `@switch` block.
 */
export type DefaultToken = TokenWithSpan<{
  /**
   * Discriminant identifying this token as a default keyword.
   */
  type: TokenType.DEFAULT
}>
