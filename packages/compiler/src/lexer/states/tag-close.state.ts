import { GREATER_THEN, SPACE } from "../../costants/chars.constants";
import { Cursor } from "../models/cursor.model";
import { LexerState } from "../models/lexer-state.enum";
import { TokenType } from "../models/token-type.enum";
import { LexerTransitionFunctionContext } from "../models/transition-function/transition-function-context.type";
import { LexerTransitionFunctionReturnType } from "../models/transition-function/transition-function-return-type.type";

export function consumeTagClose(cursor: Cursor, _context: LexerTransitionFunctionContext): LexerTransitionFunctionReturnType {
  let read = true;
  let tagName = '';
  let retVal!: LexerTransitionFunctionReturnType;

  // Skip '</'
  cursor.advance(2);

  /*
    Skip all the spaces between '</' and the actual tag name
    Ex: '</         div>
  */
  while (cursor.peek() === SPACE) {
    cursor.advance();
  }

  while (read) {
    switch (cursor.peek()) {
      case GREATER_THEN:
        cursor.advance();
        retVal = {
          state: LexerState.TEXT,
          tokens: [{
            type: TokenType.TAG_CLOSE_NAME, 
            parts: [tagName]
          }]
        };
        read = false;
        break;

      case SPACE:
        throw new Error('Tag Close Name cannot contains spaces');

      default:
        cursor.advance();
        tagName = `${tagName}${cursor.currentChar.value}`;
    }
  }

  return retVal;
}