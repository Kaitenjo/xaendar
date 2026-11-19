import { TokenType } from '../token-type.enum';
import type { TokenWithSpan } from '../token-with-span.type';

/**
 * Token emitted when the lexer encounters a `@placeholder` keyword.
 */
export type PlaceholderToken = TokenWithSpan<{
  /**
   * Discriminant identifying this token as a placeholder keyword.
   */
  type: TokenType.PLACEHOLDER
}>
