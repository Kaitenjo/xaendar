import { TokenType } from '../token-type.enum';
import { TokenWithSpan } from '../token.type';

/**
 * Token emitted when the lexer encounters a `@render` keyword.
 */
export type RenderToken = TokenWithSpan<{
  /**
   * Discriminant identifying this token as a render keyword.
   */
  type: TokenType.RENDER
}>
