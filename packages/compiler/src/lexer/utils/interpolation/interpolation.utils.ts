import { DOUBLE_QUOTE } from '../../../costants/chars.constant';
import { LexerCursor } from '../../types/lexer-cursor/lexer-cursor.model';
import { LexerState } from '../../types/lexer-state.enum';
import { LexerTransitionFunctionContext } from '../../types/transition-function/transition-function-context.type';
import { resolveTagBodyState } from '../tag-body-state/tag-body-state.utils';

/**
 * Ends an interpolation: consumes the `}` closing it and, when the interpolation is the value of an attribute, the `"`
 * closing the value. The state to transition to depends on the state the interpolation is in, the last one of the
 * history: the bindings of the tag after the value of an attribute, the text or the body of the tag otherwise.
 *
 * @param cursor - The lexer cursor positioned right before the `}` closing the interpolation.
 * @param context - The lexer context, whose history ends with the state the interpolation is in.
 * @returns The state to transition to.
 * @throws When the interpolation is the value of an attribute and is not followed by a double quote, or the
 *   interpolation is in an unexpected state.
 */
export function closeInterpolation(cursor: LexerCursor, context: LexerTransitionFunctionContext): LexerState {
  // Consume the '}' closing the interpolation
  cursor.advance();
  const previousState = context.history.at(-1);

  switch (previousState) {
    case LexerState.ATTRIBUTE:
      if (cursor.peek() !== DOUBLE_QUOTE) {
        throw `Interpolation must end with double quotes '"', found '${String.fromCharCode(cursor.peek())}'`;
      }

      // Consume '"'
      cursor.advance();
      return resolveTagBodyState(context.history.at(-2));

    case LexerState.TEXT:
    case LexerState.TAG_BODY:
      return previousState;

    default:
      throw `Unexpected state '${previousState}' after interpolation expression`;
  }
}
