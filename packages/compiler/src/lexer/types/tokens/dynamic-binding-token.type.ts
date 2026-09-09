import { TokenType } from '../token-type.enum';
import { TokenWithSpan } from '../token.type';

/**
 * Token emitted when the lexer encounters a dynamic binding, e.g. `<div @(bindPlaceholder(), placeholder="{placeholder()}") />`.
 */
export type DynamicBindingToken = TokenWithSpan<{
  /**
   * Discriminant identifying this token as a dynamic binding.
   */
  type: TokenType.DYNAMIC_BINDING
  /**
   * The condition expression of the dynamic binding.
   */
  parts: [condition: string];
}>
