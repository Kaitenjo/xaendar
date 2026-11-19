import { TokenType } from '../token-type.enum';
import type { TokenWithSpan } from '../token-with-span.type';

/**
 * Token emitted when the lexer consumes an element ref, e.g. `#name` in `<input #name />`.
 */
export type ElementRefToken = TokenWithSpan<{
  /**
   * Discriminant identifying this token as an element ref.
   */
  type: TokenType.ELEMENT_REF;
  /**
   * The name of the ref.
   */
  parts: [name: string];
}>
