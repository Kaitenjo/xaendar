import { TokenType } from '../token-type.enum.js';

/**
 * Token emitted when the lexer encounters a `@case` keyword.
 */
export type CaseToken = {
  /**
   * Discriminant identifying this token as a case keyword.
   */
  type: TokenType.CASE
}
