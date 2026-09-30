import { AT_SIGN, CR, GREATER_THEN, LF, RIGHT_BRACE, SLASH, SPACE, TAB } from '../../../costants/chars.constants';
import { LexerCursor } from '../../types/lexer-cursor/lexer-cursor.model';
import { LexerState } from '../../types/lexer-state.enum';
import { TokenType } from '../../types/token-type.enum';
import { LexerTransitionFunctionContext } from '../../types/transition-function/transition-function-context.type';
import { LexerTransitionFunctionReturnType } from '../../types/transition-function/transition-function-return-type.type';
import { isConditionalBindingKeyword } from '../../utils/conditional-binding/conditional-binding.utils';
import { resolveTagBodyState } from '../../utils/tag-body-state/tag-body-state.utils';

/**
 * Lexes the bindings declared in a block of a conditional binding, between `{` and `}`:
 * attributes, events, directives and nested conditional bindings, while `}` closes the block
 * and resumes the state the conditional binding was declared in.
 *
 * The block of a `@switch` is lexed by this state too, even if it only holds `@case` and `@default` branches:
 * the flow-control keywords are recognised wherever they are declared and the parser rejects the misplaced ones.
 *
 * @param cursor - The lexer cursor pointing to the current position in the block.
 * @param context - The lexer context, whose history tells where the conditional binding was declared.
 * @returns An object containing the next lexer state and the tokens produced.
 * @throws If a directive is declared in a conditional binding belonging to another directive, or the tag ends before `}`.
 */
export function lexConditionalBindingBody(cursor: LexerCursor, context: LexerTransitionFunctionContext): LexerTransitionFunctionReturnType {
  let read = true;
  let retVal!: LexerTransitionFunctionReturnType;

  while (read) {
    switch (cursor.peek()) {
      case AT_SIGN:
        let state = LexerState.EVENT;
        if (isConditionalBindingKeyword(cursor)) {
          // The keyword is consumed by the flow-control state.
          state = LexerState.FLOW_CONTROL;
        } else if (cursor.peekMatch('@@')) {
          /*
            A conditional binding declared inside a directive binds the properties and
            the events of that directive, so it cannot apply another directive.
          */
          if (context.history.includes(LexerState.DIRECTIVE)) {
            throw 'Directives cannot be declared inside another directive';
          }

          state = LexerState.DIRECTIVE;
          // Consume `@@`.
          cursor.advance(2);
        }

        retVal = {
          state
        };
        read = false;
        break;

      // A tag can span multiple lines: tabs and line breaks separate the bindings exactly like spaces
      case SPACE:
      case TAB:
      case LF:
      case CR:
        cursor.skipSpaces();
        break;

      case RIGHT_BRACE:
        cursor.advance();
        retVal = {
          /*
            The last state of the history is the FLOW_CONTROL_BLOCK one opening this block, the one before
            tells where the conditional binding was declared: in the tag body, inside a directive
            or in a block of another conditional binding.
          */
          state: resolveTagBodyState(context.history.at(-2)),
          tokens: [{
            type: TokenType.BLOCK_CLOSE
          }],
          popState: true
        };
        read = false;
        break;

      case GREATER_THEN:
      case SLASH:
        throw 'Conditional binding blocks must be closed by \'}\'';

      default:
        retVal = {
          state: LexerState.ATTRIBUTE
        };
        read = false;
    }
  }

  return retVal;
}
