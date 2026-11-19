import { TokenType } from '../token-type.enum';
import type { TokenWithSpan } from '../token-with-span.type';

/**
 * Token emitted when the lexer encounters the closing `>` of an opening tag.
 */
export type TagCloseToken = TokenWithSpan<{
  /**
   * Discriminant identifying this token as a tag open end.
   */
  type: TokenType.TAG_OPEN_END,
  /**
   * No associated parts for this token.
   */
  parts: []
}>
