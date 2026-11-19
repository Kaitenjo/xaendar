import { TokenType } from '../token-type.enum';
import type { TokenWithSpan } from '../token-with-span.type';

/**
 * Token emitted when the lexer encounters a `@loading` keyword.
 */
export type LoadingToken = TokenWithSpan<{
  /**
   * Discriminant identifying this token as a loading keyword.
   */
  type: TokenType.LOADING
}>
