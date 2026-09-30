import { EQUAL_THEN, GREATER_THEN, LPAREN, RPAREN, SLASH, SPACE } from '../../../costants/chars.constants';
import { LexerCursor } from '../../types/lexer-cursor/lexer-cursor.model';
import { LexerState } from '../../types/lexer-state.enum';
import { TokenType } from '../../types/token-type.enum';
import { LexerTransitionFunctionContext } from '../../types/transition-function/transition-function-context.type';
import { LexerTransitionFunctionReturnType } from '../../types/transition-function/transition-function-return-type.type';
import { resolveTagBodyState } from '../../utils/tag-body-state/tag-body-state.utils';

/**
 * Consumes the selector of a directive, after the `@@` already consumed by the state the directive is declared in.
 *
 * - `@@selector(`: emits a DIRECTIVE token, consumes `(` and transitions to DIRECTIVE_BODY,
 *   pushing the DIRECTIVE state so the bindings know which construct they belong to.
 * - `@@selector` followed by a space, `>`, `/` or the `)` closing the conditional binding the directive
 *   is declared in: the directive has no bindings, so both the DIRECTIVE and the DIRECTIVE_CLOSE tokens
 *   are emitted and the lexer goes back to the state the directive was declared in.
 *
 * @param cursor - The lexer cursor positioned right after `@@`.
 * @param context - The lexer context, whose history tells where the directive is declared.
 * @returns Transition result with the directive tokens and the next state.
 * @throws If the selector is empty, the bindings are not declared between parentheses, or a `)` is found outside of a conditional binding.
 */
export function lexDirective(cursor: LexerCursor, context: LexerTransitionFunctionContext): LexerTransitionFunctionReturnType {
  let read = true;
  let selector = '';
  let retVal!: LexerTransitionFunctionReturnType;

  while (read) {
    switch (cursor.peek()) {
      case LPAREN:
        assertSelector(selector);
        // Consume '('
        cursor.advance();
        retVal = {
          state: LexerState.DIRECTIVE_BODY,
          tokens: [{
            type: TokenType.DIRECTIVE,
            parts: [selector],
          }],
          pushState: true
        };
        read = false;
        break;

      case RPAREN:
        // Outside of a conditional binding there is nothing for ')' to close
        if (resolveTagBodyState(context.history.at(-1)) === LexerState.TAG_BODY) {
          throw new Error('Unexpected \')\': there is no conditional binding or directive to close');
        }

      /*
        Break is missing on purpose: the ')' is left to the conditional binding body,
        which closes the construct, exactly like the other characters ending the selector.
      */
      case SPACE:
      case GREATER_THEN:
      case SLASH:
        assertSelector(selector);

        retVal = {
          state: resolveTagBodyState(context.history.at(-1)),
          tokens: [
            {
              type: TokenType.DIRECTIVE,
              parts: [selector],
            },
            {
              type: TokenType.DIRECTIVE_CLOSE,
            }
          ]
        };
        read = false;
        break;

      case EQUAL_THEN:
        throw 'Directive bindings must be declared between parentheses, e.g. @@selector(name="value")';

      default:
        cursor.advance();
        selector = `${selector}${cursor.currentChar.value}`;
    }
  }

  return retVal;
}

/**
 * Ensures a directive selector is not empty.
 *
 * @param selector - The selector read so far.
 * @throws If the selector is empty.
 */
function assertSelector(selector: string): void {
  if (!selector) {
    throw 'Directive selector cannot be empty';
  }
}
