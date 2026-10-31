import { CR, EQUAL_THEN, GREATER_THEN, LESS_THAN, LF, LPAREN, RIGHT_BRACE, RPAREN, SLASH, SPACE, TAB } from '../../../costants/chars.constant';
import { LexerCursor } from '../../types/lexer-cursor/lexer-cursor.model';
import { LexerState } from '../../types/lexer-state.enum';
import { TokenType } from '../../types/token-type.enum';
import type { MaybeTokenWithSpan } from '../../types/maybe-token-with-span.type';
import type { DirectiveToken } from '../../types/tokens/directive-token.type';
import type { StructuralDirectiveToken } from '../../types/tokens/structural-directive-token.type';
import { LexerTransitionFunctionContext } from '../../types/transition-function/transition-function-context.type';
import { LexerTransitionFunctionReturnType } from '../../types/transition-function/transition-function-return-type.type';
import { resolveTagBodyState } from '../../utils/tag-body-state/tag-body-state.utils';
import { lexTypeArguments } from '../../utils/type-arguments/type-arguments.utils';

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
  let typeArguments: string | undefined;
  let retVal!: LexerTransitionFunctionReturnType;

  while (read) {
    switch (cursor.peek()) {
      case LPAREN:
        assertSelector(selector);
        // Consume '('
        cursor.advance();
        retVal = {
          state: LexerState.DIRECTIVE_BODY,
          tokens: [toDirectiveToken(type, selector, typeArguments)],
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
            toDirectiveToken(type, selector, typeArguments),
            {
              type: TokenType.DIRECTIVE_CLOSE,
            }
          ]
        };
        read = false;
        break;

      case LESS_THAN:
        assertSelector(selector);
        if (typeArguments !== undefined) {
          throw 'A directive can declare its type arguments only once, right after its selector';
        }

        // Consume '<'
        cursor.advance();
        typeArguments = lexTypeArguments(cursor, LESS_THAN);
        break;

      case EQUAL_THEN:
        throw type === TokenType.DIRECTIVE
          ? 'Directive bindings must be declared between parentheses, e.g. @@selector(name="value")'
          : 'Structural directive bindings must be declared between parentheses, e.g. *selector(name="value")';

      default:
        if (typeArguments !== undefined) {
          throw 'The type arguments of a directive must be followed by its bindings between parentheses, e.g. @@selector<string>(name="value")';
        }

        cursor.advance();
        selector = `${selector}${cursor.currentChar.value}`;
    }
  }

  return retVal;
}

/**
 * Builds the token of a directive or of a structural directive.
 *
 * @param type - The type of the token.
 * @param selector - The selector of the directive.
 * @param typeArguments - The text of the type arguments, if the directive declares them.
 * @returns The token, whose second part is the text of the type arguments only when the directive declares them.
 */
function toDirectiveToken(type: TokenType.DIRECTIVE | TokenType.STRUCTURAL_DIRECTIVE, selector: string, typeArguments: string | undefined): MaybeTokenWithSpan<DirectiveToken | StructuralDirectiveToken> {
  return typeArguments === undefined ? { type, parts: [selector] } : { type, parts: [selector, typeArguments] }
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
