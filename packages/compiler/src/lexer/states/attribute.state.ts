import { GREATER_THEN, LEFT_BRACE, SLASH, SPACE } from "../../costants/chars.constants";
import { Cursor } from "../models/cursor.model";
import { LexerState } from "../models/lexer-state.enum";
import { TokenType } from "../models/token-type.enum";
import { LexerTransitionFunctionContext } from "../models/transition-function/transition-function-context.type";
import { LexerTransitionFunctionReturnType } from "../models/transition-function/transition-function-return-type.type";

export function consumeAttribute(cursor: Cursor, _context: LexerTransitionFunctionContext): LexerTransitionFunctionReturnType {
  let read = true;
  let attribute = '';
  let retVal!: LexerTransitionFunctionReturnType;

  while (read) {
    switch (cursor.peek()) {
      case SPACE:
      case SLASH:
      case GREATER_THEN:
        retVal = {
          state: LexerState.TAG_BODY,
          tokens: [{
            type: TokenType.ATTRIBUTE,
            parts: [attribute]
          }] 
        };
        read = false;
        break;

      case LEFT_BRACE:
        retVal = {
          state: LexerState.INTERPOLATION,
          tokens: [{
            type: TokenType.ATTRIBUTE,
            parts: [attribute]
          }],
          pushState: true 
        };
        read = false;
        break;

      default:
        cursor.advance();
        attribute = `${attribute}${cursor.currentChar.value}`
    }
  }

  return retVal;
}