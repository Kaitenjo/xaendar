import { GREATER_THEN, SLASH, SPACE } from "../../costants/chars.constants";
import { Cursor } from "../models/cursor.model";
import { LexerState } from "../models/lexer-state.enum";
import { TokenType } from "../models/token-type.enum";
import { LexerTransitionFunctionReturnType } from "../models/transition-function-return-type.type";

  export function consumeTagOpenName(cursor: Cursor): LexerTransitionFunctionReturnType {
    let read = true;
    let tagName = '';

    // Consume '<' character
    cursor.advance();

    /*
      Skip all the spaces between '<' and the actual tag name
      Ex: '<         div>
    */
    while (cursor.peek() === SPACE) {
      cursor.advance();
    }

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
          read = false;
          break;
        default:
          cursor.advance();
          tagName = `${tagName}${cursor.currentChar.value}`
      }
    }

    return {
      state: LexerState.TAG_OPEN_BODY,
      tokens: [{
        type: TokenType.TAG_OPEN_NAME,
        parts: [tagName]
      }]
    }
  }