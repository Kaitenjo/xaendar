import { TokenType } from '../token-type.enum';
import type { TokenWithSpan } from '../token-with-span.type';

/**
 * Token emitted when the lexer encounters a `@defer` keyword.
 */
export type DeferToken = TokenWithSpan<{
  /**
   * Discriminant identifying this token as a defer keyword.
   */
  type: TokenType.DEFER
}>
