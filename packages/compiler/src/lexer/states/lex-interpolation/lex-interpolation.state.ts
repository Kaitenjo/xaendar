import { RIGHT_BRACE } from '../../../costants/chars.constant';
import { LexerCursor } from '../../types/lexer-cursor/lexer-cursor.model';
import { LexerState } from '../../types/lexer-state.enum';
import { TokenType } from '../../types/token-type.enum';
import type { TokenWithOptionalSpan } from '../../types/token-with-optional-span.type';
import { LexerTransitionFunctionContext } from '../../types/transition-function/transition-function-context.type';
import { LexerTransitionFunctionReturnType } from '../../types/transition-function/transition-function-return-type.type';
import { lexExpressionText } from '../../utils/expression-text/expression-text.utils';
import { closeInterpolation } from '../../utils/interpolation/interpolation.utils';

/**
 * Consumes an interpolation `{ expression }`: the `{`, the spaces after it and the expression, up to the `}` closing it.
 * Emits an INTERPOLATION_EXPRESSION token and pops the state stack to return to the previous state
 * (ATTRIBUTE, TEXT or TAG_BODY).
 *
 * The literals and the groups of the expression never close it (see `lexExpressionText`): `{ '}' }` and
 * `` { `a ${ `b` } c` } `` are single expressions.
 *
 * A cast closing the interpolation (`{ value() as string }`) ends the expression: the token is emitted, and the CAST
 * state reads the cast and closes the interpolation.
 *
 * @param cursor - The lexer cursor positioned right before the `{` opening the interpolation.
 * @param context - The lexer context used to retrieve the previous state for restoration.
 * @returns Transition result with the INTERPOLATION_EXPRESSION token and restored state, or the CAST state.
 * @throws When an ATTRIBUTE interpolation is not followed by a double quote, or the previous state is unexpected.
 */
export function lexInterpolation(cursor: LexerCursor, context: LexerTransitionFunctionContext): LexerTransitionFunctionReturnType {
  // Consume the '{' and the spaces before the expression, e.g. '{         label}'
  cursor.advance();
  cursor.skipSpaces();

  // The token spans from the expression, as the parser maps it onto the template
  const start = cursor.currentChar.index + 1;
  const expression = lexExpressionText(cursor, '}', { cast: true }).trimEnd();

  if (cursor.peek() !== RIGHT_BRACE) {
    return {
      state: LexerState.CAST,
      tokens: [{ type: TokenType.INTERPOLATION_EXPRESSION, parts: [expression], span: { start, end: cursor.currentChar.index + 1 } }]
    };
  }

  const previousState = context.history.at(-1);
  const state = closeInterpolation(cursor, context);
  const tokens = new Array<TokenWithOptionalSpan>();

  // An empty interpolation in the text or in the body of a tag generates nothing; in an attribute it would leave it without a value
  if (expression.length || previousState === LexerState.ATTRIBUTE) {
    tokens.push({
      type: TokenType.INTERPOLATION_EXPRESSION,
      parts: [expression],
      span: { start, end: cursor.currentChar.index + 1 }
    });
  }

  return {
    state,
    tokens,
    popState: true
  };
}
