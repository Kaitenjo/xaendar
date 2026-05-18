import { TokenType } from '../token-type.enum.js';

/**
 * Token emitted when the lexer encounters a `@default` keyword inside a `@switch` block.
 */
export type DefaultToken = {
  /**
   * Discriminant identifying this token as a default keyword.
   */
  type: TokenType.DEFAULT
}
