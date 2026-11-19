import { TokenType } from '../token-type.enum';
import type { TokenWithSpan } from '../token-with-span.type';

/**
 * Token emitted when the lexer consumes an @import
 */
export type ImportToken = TokenWithSpan<{
  /**
   * Discriminant identifying this token as an import.
   */
  type: TokenType.IMPORT,

  parts: [import: string],
  /**
   * Whether the statement is `@import lazy`: its modules are not imported by the template module.
   */
  lazy?: true
}>
