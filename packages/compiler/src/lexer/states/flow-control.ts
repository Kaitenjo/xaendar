import { LexerCursor } from "../models/lexer-cursor.model";
import { LexerState } from "../models/lexer-state.enum";
import { TokenType } from "../models/token-type.enum";
import { LexerTransitionFunctionContext } from "../models/transition-function/transition-function-context.type";
import { LexerTransitionFunctionReturnType } from "../models/transition-function/transition-function-return-type.type";

export function consumeFlowControl(cursor: LexerCursor, _context: LexerTransitionFunctionContext): LexerTransitionFunctionReturnType {
  let retVal!: LexerTransitionFunctionReturnType;

  // Consume '@' character
  cursor.advance();

  if (cursor.peekMatch('for ')) {
    cursor.advance(4);
    retVal = {
      state: LexerState.FLOW_CONTROL_CONDITION,
      tokens: [{
        type: TokenType.FOR
      }],
      pushState: true
    }
  } else if (cursor.peekMatch('if ')) {
    cursor.advance(2);
    retVal = {
      state: LexerState.FLOW_CONTROL_CONDITION,
      tokens: [{
        type: TokenType.IF
      }],
      pushState: true
    }
  } else if (cursor.peekMatch('else ')) {
    cursor.advance(5);
    retVal = {
      state: LexerState.FLOW_CONTROL_BLOCK,
      tokens: [{
        type: TokenType.ELSE
      }],
      pushState: true
    }
  } else if (cursor.peekMatch('switch ')) {
    cursor.advance(7);
    retVal = {
      state: LexerState.FLOW_CONTROL_CONDITION,
      tokens: [{
        type: TokenType.SWITCH
      }],
      pushState: true
    }
  } else if (cursor.peekMatch('case ')) {
    cursor.advance(5);
    retVal = {
      state: LexerState.FLOW_CONTROL_CONDITION,
      tokens: [{
        type: TokenType.CASE
      }],
      pushState: true
    }
  } else if (cursor.peekMatch('default ')) {
    cursor.advance(8);
    retVal = {
      state: LexerState.FLOW_CONTROL_BLOCK,
      tokens: [{
        type: TokenType.DEFAULT
      }],
      pushState: true
    }
  }

  return retVal
}