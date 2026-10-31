import { TokenType } from '../token-type.enum';
import type { TokenWithSpan } from '../token-with-span.type';

/**
 * Token emitted when the lexer encounters a structural directive, e.g. `*hasRole` in `<div *hasRole(role="admin") />`.
 */
export type StructuralDirectiveToken = TokenWithSpan<{
  /**
   * Discriminant identifying this token as a structural directive.
   */
  type: TokenType.STRUCTURAL_DIRECTIVE
  /**
   * The selector of the structural directive, then the text of its type arguments (`string` in `*hasRole<string>(...)`) if it declares them.
   */
  parts: [selector: string, typeArguments?: string];
}>
