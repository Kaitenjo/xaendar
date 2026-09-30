import { TokenType } from '../token-type.enum';
import { TokenWithSpan } from '../token.type';

/**
 * Token emitted when the lexer encounters the end of a directive, e.g. `")"` in `<div @@myDirective(display="block") />`.
 * It is emitted for directives declared without bindings too, e.g. `<div @@myDirective />`.
 */
export type DirectiveCloseToken = TokenWithSpan<{
  /**
   * Discriminant identifying this token as a directive closure.
   */
  type: TokenType.DIRECTIVE_CLOSE
}>
