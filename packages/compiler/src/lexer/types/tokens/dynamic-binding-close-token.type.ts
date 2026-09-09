import { TokenType } from '../token-type.enum';
import { TokenWithSpan } from '../token.type';

/**
 * Token emitted when the lexer encounters the closing part of a dynamic binding, e.g. `")"` in `<div @(bindPlaceholder(), placeholder="{placeholder()}") />`.
 */
export type DynamicBindingCloseToken = TokenWithSpan<{
  /**
   * Discriminant identifying this token as a dynamic binding closure.
   */
  type: TokenType.DYNAMIC_BINDING_CLOSE
}>
