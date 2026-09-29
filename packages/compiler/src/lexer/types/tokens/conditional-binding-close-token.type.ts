import { TokenType } from '../token-type.enum';
import { TokenWithSpan } from '../token.type';

/**
 * Token emitted when the lexer encounters the closing part of a conditional binding, e.g. `")"` in `<div @(bindPlaceholder(), placeholder="{placeholder()}") />`.
 */
export type ConditionalBindingCloseToken = TokenWithSpan<{
  /**
   * Discriminant identifying this token as a conditional binding closure.
   */
  type: TokenType.CONDITIONAL_BINDING_CLOSE
}>
