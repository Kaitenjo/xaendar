import { TokenType } from '../token-type.enum';
import { TokenWithSpan } from '../token.type';

/**
 * Token emitted when the lexer encounters a conditional binding, e.g. `<div @(bindPlaceholder(), placeholder="{placeholder()}") />`.
 */
export type ConditionalBindingToken = TokenWithSpan<{
  /**
   * Discriminant identifying this token as a conditional binding.
   */
  type: TokenType.CONDITIONAL_BINDING
  /**
   * The condition expression of the conditional binding.
   */
  parts: [condition: string];
}>
