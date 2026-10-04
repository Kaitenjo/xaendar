import { CR, EQUAL_THEN, GREATER_THEN, LF, LPAREN, RIGHT_BRACE, RPAREN, SLASH, SPACE, TAB } from '../../../costants/chars.constants';
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
 * - `@@selector` followed by a whitespace, `>`, `/` or the `}` closing the block of the conditional binding the
 *   directive is declared in: the directive has no bindings, so both the DIRECTIVE and the DIRECTIVE_CLOSE
 *   tokens are emitted and the lexer goes back to the state the directive was declared in.
 *
 * @param cursor - The lexer cursor positioned right after `@@`.
 * @param context - The lexer context, whose history tells where the directive is declared.
 * @returns Transition result with the directive tokens and the next state.
 * @throws If the selector is empty, the bindings are not declared between parentheses, a `)` is found, or a `}` is found outside of a conditional binding.
 */
export function lexDirective(cursor: LexerCursor, context: LexerTransitionFunctionContext): LexerTransitionFunctionReturnType {
  return lexSelector(cursor, context, TokenType.DIRECTIVE);
}

/**
 * Consumes the selector of a structural directive, after the `*` already consumed by the state the directive is declared in,
 * exactly like {@link lexDirective} does for a directive: `*selector(` opens the DIRECTIVE_BODY, pushing the
 * STRUCTURAL_DIRECTIVE state so the body knows it belongs to a structural directive, while a selector without bindings
 * is closed right away.
 *
 * @param cursor - The lexer cursor positioned right after `*`.
 * @param context - The lexer context, whose history tells where the structural directive is declared.
 * @returns Transition result with the structural directive tokens and the next state.
 * @throws If the selector is empty, the bindings are not declared between parentheses, a `)` is found, or a `}` is found outside of a conditional binding.
 */
export function lexStructuralDirective(cursor: LexerCursor, context: LexerTransitionFunctionContext): LexerTransitionFunctionReturnType {
  return lexSelector(cursor, context, TokenType.STRUCTURAL_DIRECTIVE);
}

/**
 * Consumes the selector of a directive or of a structural directive, see {@link lexDirective}.
 *
 * @param cursor - The lexer cursor positioned right after the prefix of the directive (`@@` or `*`).
 * @param context - The lexer context, whose history tells where the directive is declared.
 * @param type - The type of the token opening the directive.
 * @returns Transition result with the directive tokens and the next state.
 * @throws If the selector is empty, the bindings are not declared between parentheses, a `)` is found, or a `}` is found outside of a conditional binding.
 */
function lexSelector(cursor: LexerCursor, context: LexerTransitionFunctionContext, type: TokenType.DIRECTIVE | TokenType.STRUCTURAL_DIRECTIVE): LexerTransitionFunctionReturnType {
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
            type,
            parts: [selector],
          }],
          pushState: true
        };
        read = false;
        break;

      case RPAREN:
        // A directive cannot be declared inside another one, so there is nothing for ')' to close
        throw new Error('Unexpected \')\': there is no directive to close');

      case RIGHT_BRACE:
        // Outside of a conditional binding there is nothing for '}' to close
        if (resolveTagBodyState(context.history.at(-1)) !== LexerState.CONDITIONAL_BINDING_BODY) {
          throw new Error('Unexpected \'}\': there is no conditional binding to close');
        }

      /*
        Break is missing on purpose: the '}' is left to the conditional binding body,
        which closes the block, exactly like the other characters ending the selector.

        A tag can span multiple lines, so the selector can also be ended by a tab or a line break.
      */
      case SPACE:
      case TAB:
      case LF:
      case CR:
      case GREATER_THEN:
      case SLASH:
        assertSelector(selector);

        retVal = {
          state: resolveTagBodyState(context.history.at(-1)),
          tokens: [
            {
              type,
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
        throw type === TokenType.DIRECTIVE
          ? 'Directive bindings must be declared between parentheses, e.g. @@selector(name="value")'
          : 'Structural directive bindings must be declared between parentheses, e.g. *selector(name="value")';

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
