import { GREATER_THEN } from "../../costants/chars.constants";
import { LexerCursor } from "../models/lexer-cursor.model";
import { LexerState } from "../models/lexer-state.enum";
import { TokenType } from "../models/token-type.enum";
import { LexerTransitionFunctionContext } from "../models/transition-function/transition-function-context.type";
import { LexerTransitionFunctionReturnType } from "../models/transition-function/transition-function-return-type.type";

export function consumeTagOpenEnd(cursor: LexerCursor, _context: LexerTransitionFunctionContext): LexerTransitionFunctionReturnType {
  let retVal!: LexerTransitionFunctionReturnType

  // We arrive in this point by reading '>' or '/' at the end of a Open Tag 
  if (cursor.peek() === GREATER_THEN) {
    cursor.advance();
    retVal = { 
      state: LexerState.TEXT,
      tokens: [{
        type: TokenType.TAG_OPEN_END,
        parts: []
      }] 
    };
  } else {
    cursor.advance();
    const nextChar = cursor.peek();

    if (nextChar === GREATER_THEN) {
      cursor.advance();
      retVal = {
        state: LexerState.TEXT,
        tokens: [{
          type: TokenType.TAG_SELF_CLOSE,
          parts: []
        }]
      };
    } else {
      throw new Error(`Unexpected character ${nextChar} for closing tag.\nExpected />\nRead of /${String.fromCharCode(nextChar)}\nAt line ${cursor.position.row + 1} col ${cursor.position.column + 1}`)
    }
  }

  return retVal
}