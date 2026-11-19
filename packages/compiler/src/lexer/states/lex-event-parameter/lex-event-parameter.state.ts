import { COMMA, RPAREN } from '../../../costants/chars.constant';
import { LexerCursor } from '../../types/lexer-cursor/lexer-cursor.model';
import { LexerState } from '../../types/lexer-state.enum';
import type { MaybeTokenWithSpan } from '../../types/maybe-token-with-span.type';
import { TokenType } from '../../types/token-type.enum';
import type { EventParAmeterToken } from '../../types/tokens/event-parameter-token.type';
import { LexerTransitionFunctionContext } from '../../types/transition-function/transition-function-context.type';
import { LexerTransitionFunctionReturnType } from '../../types/transition-function/transition-function-return-type.type';
import { closeEventParameters } from '../../utils/event-parameters/event-parameters.utils';
import { lexExpressionText } from '../../utils/expression-text/expression-text.utils';

/**
 * Consumes the parameters of an event handler, each one up to the `,` or the `)` ending it (see `lexExpressionText`),
 * and emits an EVENT_PARAMETER token for each one, holding its expression without the whitespace around it.
 * A cast of a whole parameter (`$event as MouseEvent`) ends it: the token is emitted, and the CAST state reads the cast.
 *
 * @param cursor - The lexer cursor positioned after the `(` opening the parameters, or after a `,`.
 * @param context - The lexer context, whose history tells the construct the event binding is declared in.
 * @returns Transition result with the EVENT_PARAMETER tokens and the state following the event binding, or the CAST state.
 * @throws When the parameters are not followed by a double quote.
 */
export function lexEventParameter(cursor: LexerCursor, context: LexerTransitionFunctionContext): LexerTransitionFunctionReturnType {
  const tokens = new Array<MaybeTokenWithSpan<EventParAmeterToken>>();
  let next: number;

  do {
    // The whitespace before a parameter is not part of it
    cursor.skipSpaces();
    const start = cursor.currentChar.index + 1;
    const parameter = lexExpressionText(cursor, ',)', { cast: true });
    tokens.push({ type: TokenType.EVENT_PARAMETER, parts: [parameter.trimEnd()], span: { start, end: cursor.currentChar.index + 1 } });

    next = cursor.peek();
    if (next === COMMA) {
      cursor.advance();
    }
  } while (next === COMMA);

  // The parameter is followed by the whitespace before the `as` of its cast
  if (next !== RPAREN) {
    return { state: LexerState.CAST, tokens };
  }

  const state = closeEventParameters(cursor, context);
  // The last parameter spans up to the end of the event binding
  tokens[tokens.length - 1].span!.end = cursor.currentChar.index + 1;
  return { state, tokens };
}
