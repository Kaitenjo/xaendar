import { TokenType } from '../token-type.enum';
import type { TokenWithSpan } from '../token-with-span.type';

/**
 * Token emitted when the lexer encounters a `@switch` keyword.
 */
export type SwitchToken = TokenWithSpan<{
  /**
   * Discriminant identifying this token as a switch keyword.
   */
  type: TokenType.SWITCH
}>
