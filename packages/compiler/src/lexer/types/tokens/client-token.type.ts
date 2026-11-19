import { TokenType } from '../token-type.enum';
import type { TokenWithSpan } from '../token-with-span.type';

/**
 * Token emitted when the lexer encounters a `@client` keyword.
 */
export type ClientToken = TokenWithSpan<{
  /**
   * Discriminant identifying this token as a client keyword.
   */
  type: TokenType.CLIENT
}>
