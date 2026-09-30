import { AT_SIGN, GREATER_THEN, RPAREN, SLASH, SPACE } from '../../../costants/chars.constants';
import { LexerCursor } from '../../types/lexer-cursor/lexer-cursor.model';
import { LexerState } from '../../types/lexer-state.enum';
import { TokenType } from '../../types/token-type.enum';
import { LexerTransitionFunctionContext } from '../../types/transition-function/transition-function-context.type';
import { LexerTransitionFunctionReturnType } from '../../types/transition-function/transition-function-return-type.type';
import { resolveTagBodyState } from '../../utils/tag-body-state/tag-body-state.utils';

/**
 * Lexes the bindings of a directive declared between `@@selector(` and `)`:
 * properties are lexed as attributes, events as event bindings and `@(` opens a
 * conditional binding, while `)` closes the directive and resumes the state the
 * directive was declared in.
 *
 * @param cursor - The lexer cursor pointing to the current position in the directive body.
 * @param context - The lexer context, whose history tells where the directive was declared.
 * @returns An object containing the next lexer state and the tokens produced.
 * @throws If a directive is declared inside the directive, or the tag ends before `)`.
 */
export function lexDirectiveBody(cursor: LexerCursor, context: LexerTransitionFunctionContext): LexerTransitionFunctionReturnType {
  let read = true;
  let retVal!: LexerTransitionFunctionReturnType;

  while (read) {
    switch (cursor.peek()) {
      case AT_SIGN:
        if (cursor.peekMatch('@@')) {
          throw 'Directives cannot be declared inside another directive';
        }

        let state = LexerState.EVENT;
        if (cursor.peekMatch('@(')) {
          state = LexerState.CONDITIONAL_BINDING_START;
          // Consume `@(`.
          cursor.advance(2);
        }

        retVal = {
          state
        };
        read = false;
        break;

      case SPACE:
        cursor.skipSpaces();
        break;

      case RPAREN:
        cursor.advance();
        retVal = {
          /*
            The last state of the history is the DIRECTIVE one opening this body, the one before
            tells where the directive was declared: in the tag body or inside a conditional binding.
          */
          state: resolveTagBodyState(context.history.at(-2)),
          tokens: [{
            type: TokenType.DIRECTIVE_CLOSE
          }],
          popState: true
        };
        read = false;
        break;

      case GREATER_THEN:
      case SLASH:
        throw 'Directive bindings must be closed by \')\'';

      default:
        retVal = {
          state: LexerState.ATTRIBUTE
        };
        read = false;
    }
  }

  return retVal;
}
