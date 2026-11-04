import { TokenType } from '../token-type.enum';
import type { TokenWithSpan } from '../token-with-span.type';

/**
 * Token emitted when the lexer consumes the declaration after `@let`, e.g. `total = price() * quantity();` in
 * `@let total = price() * quantity();`.
 */
export type LetDeclarationToken = TokenWithSpan<{
  /**
   * Discriminant identifying this token as the declaration of a `@let`.
   */
  type: TokenType.LET_DECLARATION;
  /**
   * The name, then the raw text of the value, between the `=` and the `;`.
   */
  parts: [name: string, value: string];
}>
