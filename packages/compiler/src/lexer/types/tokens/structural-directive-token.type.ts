import { TokenType } from '../token-type.enum';
import { TokenWithSpan } from '../token.type';

/**
 * Token emitted when the lexer encounters a structural directive, e.g. `*hasRole` in `<div *hasRole(role="admin") />`.
 */
export type StructuralDirectiveToken = TokenWithSpan<{
  /**
   * Discriminant identifying this token as a structural directive.
   */
  type: TokenType.STRUCTURAL_DIRECTIVE
  /**
   * The selector of the structural directive.
   */
  parts: [selector: string];
}>
