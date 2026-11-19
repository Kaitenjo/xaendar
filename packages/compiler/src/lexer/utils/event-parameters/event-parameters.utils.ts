import { DOUBLE_QUOTE } from '../../../costants/chars.constant';
import { LexerCursor } from '../../types/lexer-cursor/lexer-cursor.model';
import { LexerState } from '../../types/lexer-state.enum';
import { LexerTransitionFunctionContext } from '../../types/transition-function/transition-function-context.type';
import { resolveTagBodyState } from '../tag-body-state/tag-body-state.utils';

/**
 * Ends the parameters of an event handler: consumes the `)` closing them and the `"` closing the event binding.
 *
 * @param cursor - The lexer cursor positioned right before the `)` closing the parameters.
 * @param context - The lexer context, whose history tells the construct the event binding is declared in.
 * @returns The state lexing the bindings of the tag, or of the construct, after the event binding.
 * @throws When the `)` is not followed by a double quote.
 */
export function closeEventParameters(cursor: LexerCursor, context: LexerTransitionFunctionContext): LexerState {
  // Consume ')'
  cursor.advance();

  if (cursor.peek() !== DOUBLE_QUOTE) {
    throw 'Event must be included in Double Quotes';
  }

  // Consume '"'
  cursor.advance();
  return resolveTagBodyState(context.history.at(-1));
}
