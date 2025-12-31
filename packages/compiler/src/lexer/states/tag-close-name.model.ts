import { GREATER_THEN, SPACE } from "../../costants/chars.constants";
import { Cursor } from "../models/cursor.model";
import { LexerState } from "../models/lexer-state.enum";
import { TokenType } from "../models/token-type.enum";
import { Token } from "../models/token.type";
import { LexerTransitionFunctionReturnType } from "../models/transition-function-return-type.type";

  export function consumeTagCloseName(cursor: Cursor): LexerTransitionFunctionReturnType {
    let read = true;
    let nextState!: LexerState;
    let tagName = '';
    const tokens = new Array<Token>;

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
          tokens.push(
            { type: TokenType.TAG_CLOSE_NAME, parts: [tagName] },
          );
          cursor.advance();
          nextState = LexerState.TEXT;
          read = false;
          break;

        case SPACE:
          throw new Error('Tag Close Name cannot contains spaces');

        default:
          cursor.advance();
          tagName = `${tagName}${cursor.currentChar.value}`;
      }
    }

    return {
      state: nextState,
      tokens
    }
  }