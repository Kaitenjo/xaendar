import type { Span } from '../../types/span.type';
import type { TokenType } from './token-type.enum';

/**
 * A token with its span.
 *
 * @template T - The token.
 */
export type TokenWithSpan<T extends { type: TokenType }> = T & {
  /**
   * Where the token is in the template.
   */
  span: Span
}
