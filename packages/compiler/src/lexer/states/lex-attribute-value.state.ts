import { DOUBLE_QUOTE } from "../../costants/chars.constants";
import { LexerCursor } from "../types/lexer-cursor.model";
import { LexerState } from "../types/lexer-state.enum";
import { TokenType } from "../types/token-type.enum";
import { LexerTransitionFunctionContext } from "../types/transition-function/transition-function-context.type";
import { LexerTransitionFunctionReturnType } from "../types/transition-function/transition-function-return-type.type";

/**
 * Consumes a quoted attribute value `"..."`, collecting characters until
 * the closing `"` is found. Emits an ATTRIBUTE_VALUE token and transitions
 * back to TAG_BODY.
 *
 * @param cursor - The lexer cursor positioned at the first character of the value (after the opening `"`).
 * @param context - Unused lexer context.
 * @returns Transition result with the ATTRIBUTE_VALUE token and the TAG_BODY state.
 */
export function lexAttributeValue(cursor: LexerCursor, context: LexerTransitionFunctionContext): LexerTransitionFunctionReturnType {
  let read = true;
  let value = '';
  let retVal!: LexerTransitionFunctionReturnType;

  while (read) {
    switch (cursor.peek()) {
      case DOUBLE_QUOTE:
        cursor.advance();
        read = false;

        retVal = {
          // Last state is the attribute, so we need to look two steps back in the history to determine the correct next state.
          state: context.history.at(-2) === LexerState.DYNAMIC_BINDING_START ? LexerState.DYNAMIC_BINDING_BODY : LexerState.TAG_BODY,
          tokens: [{
            type: TokenType.ATTRIBUTE_VALUE,
            parts: [value]
          }],
          popState: true
        }
        break;

      default:
        cursor.advance();
        value = `${value}${cursor.currentChar.value}`;
    }
  }
  
  return retVal;
}