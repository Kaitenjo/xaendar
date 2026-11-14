import { TokenType } from '../token-type.enum';
import type { TokenWithSpan } from '../token-with-span.type';

/**
 * Token emitted when the lexer encounters a `@default` keyword inside a `@switch` block, or a `@default never;`,
 * whose span covers the whole statement.
 */
export type DefaultToken = TokenWithSpan<{
  /**
   * Discriminant identifying this token as a default keyword.
   */
  type: TokenType.DEFAULT;
  /**
   * Set for `@default never;`, which declares no branch: the `@case` branches of the `@switch` cover every value of
   * its expression.
   */
  never?: true;
}>
