import { COMMA } from '../../../costants/chars.constant';
import { LexerCursor } from '../../types/lexer-cursor/lexer-cursor.model';
import { LexerState } from '../../types/lexer-state.enum';
import type { MaybeTokenWithSpan } from '../../types/maybe-token-with-span.type';
import { TokenType } from '../../types/token-type.enum';
import type { CastToken } from '../../types/tokens/cast-token.type';
import { LexerTransitionFunctionContext } from '../../types/transition-function/transition-function-context.type';
import { LexerTransitionFunctionReturnType } from '../../types/transition-function/transition-function-return-type.type';
import { closeEventParameters } from '../../utils/event-parameters/event-parameters.utils';
import { lexExpressionText } from '../../utils/expression-text/expression-text.utils';
import { closeInterpolation } from '../../utils/interpolation/interpolation.utils';

/**
 * Consumes the cast closing an interpolation or a parameter of an event handler, `as` and the type after it, e.g.
 * `as string` in `{ value() as string }` or `as MouseEvent` in `(click)="select($event as MouseEvent)"`, and emits a
 * CAST token holding the type as written. The token before it tells what the cast closes:
 * - an INTERPOLATION_EXPRESSION: the type goes on up to the `}` closing the interpolation, and the interpolation is
 *   closed as `lexInterpolation` does;
 * - an EVENT_PARAMETER: the type goes on up to the `,` or the `)` ending the parameter, then the next parameter is
 *   read, or the event binding is closed.
 *
 * The groups of the type and its literals never end it (see `lexExpressionText`): `Map<string, number>`,
 * `(value: number) => void`, `{ id: string, label: string }`, `'a,b'`.
 *
 * @param cursor - The lexer cursor positioned right before the whitespace preceding `as`.
 * @param context - The lexer context, whose last token is the expression the cast closes.
 * @returns Transition result with the CAST token and the state following the interpolation or the parameter.
 * @throws When the type is blank, an event binding is not closed by a double quote, an interpolation in an attribute
 *   is not followed by a double quote, or an interpolation is in an unexpected state.
 */
export function lexCast(cursor: LexerCursor, context: LexerTransitionFunctionContext): LexerTransitionFunctionReturnType {
  // Consume the whitespace before `as`, `as` itself and the whitespace after it
  cursor.skipSpaces();
  cursor.advance(2);
  cursor.skipSpaces();

  const isInterpolation = context.tokens.at(-1)?.type === TokenType.INTERPOLATION_EXPRESSION;
  const type = lexExpressionText(cursor, isInterpolation ? '}' : ',)', { types: true }).trimEnd();
  if (!type) {
    throw 'A cast needs a type after "as", e.g. { value() as string }';
  }

  const tokens: MaybeTokenWithSpan<CastToken>[] = [{ type: TokenType.CAST, parts: [type] }];

  if (isInterpolation) {
    return { state: closeInterpolation(cursor, context), tokens, popState: true };
  }

  if (cursor.peek() === COMMA) {
    // Consume ',': the EVENT_PARAMETER state skips the whitespace before the next parameter
    cursor.advance();
    return { state: LexerState.EVENT_PARAMETER, tokens };
  }

  return { state: closeEventParameters(cursor, context), tokens };
}
