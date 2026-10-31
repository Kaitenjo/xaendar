import { TokenType } from '../token-type.enum';
import type { TokenWithSpan } from '../token-with-span.type';

/**
 * Token emitted when the lexer consumes a run of plain text content.
 */
export type TextToken = TokenWithSpan<{
  /**
   * Discriminant identifying this token as plain text.
   */
  type: TokenType.TEXT,
  /**
   * `parts[0]` is the raw text string.
   */
  parts: [string]
}>
