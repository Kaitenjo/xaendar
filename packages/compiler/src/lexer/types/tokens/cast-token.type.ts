import { TokenType } from '../token-type.enum';
import type { TokenWithSpan } from '../token-with-span.type';

/**
 * Token emitted when the lexer consumes the cast closing an interpolation or a parameter of an event handler, e.g.
 * `as string` in `{ value() as string }`: it follows the INTERPOLATION_EXPRESSION or the EVENT_PARAMETER token.
 */
export type CastToken = TokenWithSpan<{
  /**
   * Discriminant identifying this token as a cast.
   */
  type: TokenType.CAST;
  /**
   * The type, as written after `as`, e.g. `string` in `{ value() as string }`.
   */
  parts: [type: string];
}>
