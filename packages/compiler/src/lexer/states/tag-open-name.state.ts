import { GREATER_THEN, SLASH, SPACE } from "../../costants/chars.constants";
import { LexerCursor } from "../models/lexer-cursor.model";
import { LexerState } from "../models/lexer-state.enum";
import { TokenType } from "../models/token-type.enum";
import { LexerTransitionFunctionContext } from "../models/transition-function/transition-function-context.type";
import { LexerTransitionFunctionReturnType } from "../models/transition-function/transition-function-return-type.type";

export function consumeTagOpenName(cursor: LexerCursor, _context: LexerTransitionFunctionContext): LexerTransitionFunctionReturnType {
  let read = true;
  let tagName = '';
  let retVal!: LexerTransitionFunctionReturnType

  // Consume '<' character
  cursor.advance();

  /*
    Skip all the spaces between '<' and the actual tag name
    Ex: '<         div>
  */
  cursor.skipSpaces();

  /*
    Keep read input until:
    - Space: <span 
    - GT: <span>
    - Slash (Self Closing tag) <span / or <span/
  */
  while (read) {
    switch (cursor.peek()) {
      case SPACE:
      case SLASH:
      case GREATER_THEN:
        retVal = {
          state: LexerState.TAG_BODY,
          tokens: [{ 
            type: TokenType.TAG_OPEN_NAME, 
            parts: [tagName] 
          }]
        }
        read = false;
        break;

      default:
        cursor.advance();
        tagName = `${tagName}${cursor.currentChar.value}`
    }
  }

  return retVal
}