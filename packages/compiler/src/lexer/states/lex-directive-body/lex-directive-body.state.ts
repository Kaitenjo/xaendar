import { AT_SIGN, CR, GREATER_THEN, LF, LPAREN, RPAREN, SLASH, SPACE, STAR, TAB } from '../../../costants/chars.constants';
import { LexerCursor } from '../../types/lexer-cursor/lexer-cursor.model';
import { LexerState } from '../../types/lexer-state.enum';
import { TokenType } from '../../types/token-type.enum';
import { LexerTransitionFunctionContext } from '../../types/transition-function/transition-function-context.type';
import { LexerTransitionFunctionReturnType } from '../../types/transition-function/transition-function-return-type.type';
import { isConditionalBindingKeyword } from '../../utils/conditional-binding/conditional-binding.utils';
import { resolveTagBodyState } from '../../utils/tag-body-state/tag-body-state.utils';

/**
 * Lexes the bindings of a directive declared between `@@selector(` and `)`, or of a structural directive declared
 * between `*selector(` and `)`: properties are lexed as attributes, events as event bindings and `@if`/`@switch` open a
 * conditional binding, while `)` closes the directive and resumes the state the directive was declared in.
 *
 * A structural directive only binds properties: it listens to no event, since it holds no element to dispatch them on,
 * and its properties cannot be bound conditionally.
 *
 * @param cursor - The lexer cursor pointing to the current position in the directive body.
 * @param context - The lexer context, whose history tells where the directive was declared.
 * @returns An object containing the next lexer state and the tokens produced.
 * @throws If a directive is declared inside the directive, a `@` does not start a conditional binding, a structural
 *   directive declares an event or a conditional binding, or the tag ends before `)`.
 */
export function lexDirectiveBody(cursor: LexerCursor, context: LexerTransitionFunctionContext): LexerTransitionFunctionReturnType {
  // The last state of the history is the one opening this body
  const structural = context.history.at(-1) === LexerState.STRUCTURAL_DIRECTIVE;
  let read = true;
  let retVal!: LexerTransitionFunctionReturnType;

  while (read) {
    switch (cursor.peek()) {
      case AT_SIGN:
        if (cursor.peekMatch('@@')) {
          throw 'Directives cannot be declared inside another directive';
        }

        if (structural) {
          throw 'The properties of a structural directive cannot be bound conditionally';
        }

        if (!isConditionalBindingKeyword(cursor)) {
          throw '\'@\' must start a conditional binding (@if, @else, @switch, @case, @default): events are bound with (eventName)="handler()"';
        }

        retVal = {
          state: LexerState.FLOW_CONTROL
        };
        read = false;
        break;

      case STAR:
        throw 'Directives cannot be declared inside another directive';

      // A tag can span multiple lines: tabs and line breaks separate the bindings exactly like spaces
      case SPACE:
      case TAB:
      case LF:
      case CR:
        cursor.skipSpaces();
        break;

      case RPAREN:
        cursor.advance();
        retVal = {
          /*
            The last state of the history is the DIRECTIVE (or STRUCTURAL_DIRECTIVE) one opening this body, the one before
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

      case LPAREN:
        if (structural) {
          throw 'Structural directives cannot listen to events: they hold no element to dispatch them on';
        }

        retVal = {
          state: LexerState.EVENT
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
