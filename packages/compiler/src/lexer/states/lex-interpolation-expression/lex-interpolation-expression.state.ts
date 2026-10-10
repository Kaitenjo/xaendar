import { BACKSLASH, DOLLAR, DOUBLE_QUOTE, GRAVE_ACCENT, LEFT_BRACE, RIGHT_BRACE, SINGLE_QUOTE } from '../../../costants/chars.constants';
import { LexerCursor } from '../../types/lexer-cursor/lexer-cursor.model';
import { LexerState } from '../../types/lexer-state.enum';
import { TokenType } from '../../types/token-type.enum';
import { LexerTransitionFunctionContext } from '../../types/transition-function/transition-function-context.type';
import { LexerTransitionFunctionReturnType } from '../../types/transition-function/transition-function-return-type.type';
import { resolveTagBodyState } from '../../utils/tag-body-state/tag-body-state.utils';

/**
 * Consumes a JavaScript expression interpolation `{ expression }` up to the `}` closing it.
 * Emits an INTERPOLATION_EXPRESSION token and pops the state stack to return to the previous state
 * (ATTRIBUTE, TEXT or TAG_BODY).
 *
 * Braces, quotes and backticks inside string and template literals are part of the literal, so they
 * neither open nor close anything: `{ '}' }` and `` { `a ${ `b` } c` } `` are single expressions. The braces of
 * object literals and of the substitutions of template literals (`${ }`) are matched with their closing brace.
 *
 * @param cursor - The lexer cursor positioned at the first character of the expression.
 * @param context - The lexer context used to retrieve the previous state for restoration.
 * @returns Transition result with the INTERPOLATION_EXPRESSION token and restored state.
 * @throws When an ATTRIBUTE interpolation is not followed by a double quote, or the previous state is unexpected.
 */
export function lexInterpolationExpression(cursor: LexerCursor, context: LexerTransitionFunctionContext): LexerTransitionFunctionReturnType {
  let interpolation = '';
  // The open constructs the cursor is in, innermost last: braces (`{` or `${`) and template literals (`` ` ``)
  const nesting = new Array<number>();
  // The quote of the string literal the cursor is in, if any
  let quote: number | null = null;

  while (quote !== null || nesting.length || cursor.peek() !== RIGHT_BRACE) {
    const char = cursor.peek();
    interpolation = addCharacter(cursor, interpolation);

    if (quote !== null) {
      switch (char) {
        // An escaped character never closes the string
        case BACKSLASH:
          interpolation = addCharacter(cursor, interpolation);
          break;

        case quote:
          quote = null;
          break;
      }
    } else if (nesting.at(-1) === GRAVE_ACCENT) {
      switch (char) {
        // An escaped character never closes the template literal, nor starts a substitution
        case BACKSLASH:
          interpolation = addCharacter(cursor, interpolation);
          break;

        case GRAVE_ACCENT:
          nesting.pop();
          break;

        case DOLLAR:
          if (cursor.peek() === LEFT_BRACE) {
            interpolation = addCharacter(cursor, interpolation);
            nesting.push(LEFT_BRACE);
          }
          break;
      }
    } else {
      switch (char) {
        case SINGLE_QUOTE:
        case DOUBLE_QUOTE:
          quote = char;
          break;

        case GRAVE_ACCENT:
        case LEFT_BRACE:
          nesting.push(char);
          break;

        // Only reached inside a brace: the `}` closing the interpolation ends the loop
        case RIGHT_BRACE:
          nesting.pop();
          break;
      }
    }
  }

  // Consume the '}' closing the interpolation
  cursor.advance();

  /*
    After an interpolation we have to understanad where to transite
    The next state depends from the previous state
  */
  const previousState = context.history.pop();
  let state: LexerState;

  switch (previousState) {
    case LexerState.ATTRIBUTE:
      if (cursor.peek() !== DOUBLE_QUOTE) {
        throw `Interpolation must end with double quotes '"', found '${String.fromCharCode(cursor.peek())}'`;
      }

      // Consume '"'
      cursor.advance();
      state = resolveTagBodyState(context.history.at(-1));
      break;

    case LexerState.TEXT:
    case LexerState.TAG_BODY:
      state = previousState;
      break;

    default:
      throw `Unexpected state '${previousState}' after interpolation expression`;
  };

  return {
    state,
    tokens: [{
      type: TokenType.INTERPOLATION_EXPRESSION,
      parts: [interpolation.trimEnd()]
    }],
    popState: true
  };
}

/**
 * Advances the cursor by one character and appends it to the accumulator string.
 *
 * @param cursor - The lexer cursor to advance.
 * @param interpolation - The current accumulated expression string.
 * @returns The updated string with the newly consumed character appended.
 */
function addCharacter(cursor: LexerCursor, interpolation: string): string {
  cursor.advance(1);
  return `${interpolation}${cursor.currentChar.value}`;
}
