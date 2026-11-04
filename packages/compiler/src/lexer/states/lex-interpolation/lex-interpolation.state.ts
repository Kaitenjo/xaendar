import { LexerCursor } from '../../types/lexer-cursor/lexer-cursor.model';
import { LexerState } from '../../types/lexer-state.enum';
import { LexerTransitionFunctionContext } from '../../types/transition-function/transition-function-context.type';
import { LexerTransitionFunctionReturnType } from '../../types/transition-function/transition-function-return-type.type';

/**
 * Opens an interpolation: advances past `{` and any leading spaces, then transitions to INTERPOLATION_EXPRESSION.
 *
 * @param cursor - The lexer cursor positioned on the `{` character.
 * @param _context - Unused lexer context.
 * @returns Transition result with the INTERPOLATION_EXPRESSION state.
 */
export function lexInterpolation(cursor: LexerCursor, _context: LexerTransitionFunctionContext): LexerTransitionFunctionReturnType {
  // Consume '{' characters
  cursor.advance();

  /*
    Skip all the spaces between '{' and the actual interpolation content
    Ex: '{         label}
  */
  cursor.skipSpaces();

  return { state: LexerState.INTERPOLATION_EXPRESSION };
}
