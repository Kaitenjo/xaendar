import { TokenType } from '../token-type.enum.js';

/**
 * Token emitted when the lexer encounters an `@if` keyword.
 */
export type IfToken = {
  /**
   * Discriminant identifying this token as an if keyword.
   */
  type: TokenType.IF
}
