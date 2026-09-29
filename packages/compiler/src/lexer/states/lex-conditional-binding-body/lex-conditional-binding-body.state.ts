import { AT_SIGN, RPAREN, SPACE } from '../../../costants/chars.constants';
import { LexerCursor } from '../../types/lexer-cursor/lexer-cursor.model';
import { LexerState } from '../../types/lexer-state.enum';
import { TokenType } from '../../types/token-type.enum';
import { LexerTransitionFunctionContext } from '../../types/transition-function/transition-function-context.type';
import { LexerTransitionFunctionReturnType } from '../../types/transition-function/transition-function-return-type.type';

/**
 * Lexes the body of a conditional binding, handling the various characters that can appear within it.
 * @param cursor - The lexer cursor pointing to the current position in the input.
 * @param context - The context object providing additional information for the transition function.
 * @returns An object containing the next lexer state and the tokens produced.
 */
export function lexConditionalBindingBody(cursor: LexerCursor, context: LexerTransitionFunctionContext): LexerTransitionFunctionReturnType {
  let read = true;
  let retVal!: LexerTransitionFunctionReturnType;

  while (read) {
    switch (cursor.peek()) {
      case AT_SIGN:
        const conditionalBinding = cursor.peekMatch('@(');
        let state = LexerState.EVENT;
        if (conditionalBinding) {
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
            Safe assertion. When the conditional binding body is closed, there should always be a previous state in the history.
            It could be a
            TAG_BODY or another state depending on the context.
            Another CONDITIONAL_BINDING_BODY (improbable but we do support nesting)
          */
          state: context.history.at(-2) === LexerState.CONDITIONAL_BINDING_START ? LexerState.CONDITIONAL_BINDING_BODY : LexerState.TAG_BODY,
          tokens: [{
            type: TokenType.CONDITIONAL_BINDING_CLOSE
          }],
          popState: true
        };
        read = false;
        break;

      default:
        retVal = {
          state: LexerState.ATTRIBUTE
        };
        read = false;
    }
  }

  return retVal
} 