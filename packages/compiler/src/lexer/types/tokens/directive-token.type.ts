import { TokenType } from '../token-type.enum';
import { TokenWithSpan } from '../token.type';

/**
 * Token emitted when the lexer encounters a directive, e.g. `@@myDirective` in `<div @@myDirective(display="block") />`.
 */
export type DirectiveToken = TokenWithSpan<{
  /**
   * Discriminant identifying this token as a directive.
   */
  type: TokenType.DIRECTIVE
  /**
   * The selector of the directive, then the text of its type arguments (`string, number` in `@@list<string, number>(...)`) if it declares them.
   */
  parts: [selector: string, typeArguments?: string];
}>
