import { TokenType } from '../token-type.enum';
import type { TokenWithSpan } from '../token-with-span.type';

/**
 * Token emitted when the lexer encounters a `@hydrate` keyword.
 */
export type HydrateToken = TokenWithSpan<{
  /**
   * Discriminant identifying this token as a hydrate keyword.
   */
  type: TokenType.HYDRATE
}>
