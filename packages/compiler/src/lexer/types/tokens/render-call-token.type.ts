import { TokenType } from '../token-type.enum';
import { TokenWithSpan } from '../token.type';

/**
 * Token emitted when the lexer consumes the call of a template after `@render`, e.g. `row(item(), index())` in
 * `@render row(item(), index())`.
 */
export type RenderCallToken = TokenWithSpan<{
  /**
   * Discriminant identifying this token as the call of a template.
   */
  type: TokenType.RENDER_CALL;
  /**
   * The name of the template, then the raw text of the arguments (without the parentheses enclosing them, empty for
   * `row()`).
   */
  parts: [callee: string, args: string];
}>
