import { LPAREN, RPAREN } from "../../costants/chars.constants";
import { LexerCursor } from "../models/lexer-cursor.model";
import { LexerState } from "../models/lexer-state.enum";
import { TokenType } from "../models/token-type.enum";
import { LexerTransitionFunctionContext } from "../models/transition-function/transition-function-context.type";
import { LexerTransitionFunctionReturnType } from "../models/transition-function/transition-function-return-type.type";

export function consumeFlowControlCondition(cursor: LexerCursor, _context: LexerTransitionFunctionContext): LexerTransitionFunctionReturnType {
  cursor.skipSpaces();

  if (cursor.peek() !== LPAREN) {
    throw new Error(`Expected '(' but got '${String.fromCharCode(cursor.peek())}' at row ${cursor.position.row}, col ${cursor.position.column}`)
  }

  // consume '('
  cursor.advance();

  let expression = '';
  let depth = 1;

  while (depth > 0) {
    const code = cursor.peek();

    switch (code) {
      case LPAREN:
        depth++;
        cursor.advance();
        break;

      case RPAREN:
        depth--;
        if (!depth) {
          cursor.advance();
          break;
        }

        cursor.advance();
        break;

      default:
        cursor.advance();
        expression = `${expression}${cursor.currentChar.value}`;
    }
  }

  return {
    state: LexerState.FLOW_CONTROL_BLOCK,
    tokens: [{
      type: TokenType.CONDITION,
      parts: [expression]
    }],
    popState: true
  };
}
