import { TokenType } from '../token-type.enum';
import type { TokenWithSpan } from '../token-with-span.type';

/**
 * Token emitted when the lexer consumes an HTML attribute name.
 */
export type AttributeToken = TokenWithSpan<{
  /**
   * Discriminant identifying this token as an attribute.
   */
  type: TokenType.ATTRIBUTE
  /**
   * `parts[0]` is the raw `name` string.
   */
  parts: [string]
}>
