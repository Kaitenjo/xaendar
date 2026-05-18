import { LPAREN, RPAREN } from "../../costants/chars.constants.js";
import { LexerCursor } from "../models/lexer-cursor.model.js";
import { LexerState } from "../models/lexer-state.enum.js";
import { TokenType } from "../models/token-type.enum.js";
import { LexerTransitionFunctionContext } from "../models/transition-function/transition-function-context.type.js";
import { LexerTransitionFunctionReturnType } from "../models/transition-function/transition-function-return-type.type.js";

/**
 * Consumes the condition expression `(...)` of a flow-control directive,
 * handling nested parentheses correctly. Emits a CONDITION token with the
 * raw expression string and transitions to FLOW_CONTROL_BLOCK.
 *
 * @param cursor The lexer cursor positioned at the opening `(`.
 * @param _context Unused lexer context.
 * @returns Transition result with the CONDITION token and the FLOW_CONTROL_BLOCK state.
 */
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
        expression = addCharacter(cursor, expression);
        break;

      case RPAREN:
        depth--;
        if (!depth) {
          cursor.advance();
          break;
        }

        expression = addCharacter(cursor, expression);
        break;

      default:
        expression = addCharacter(cursor, expression);
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

/**
 * Advances the cursor by one character and appends it to the accumulator string.
 *
 * @param cursor The lexer cursor to advance.
 * @param expression The current accumulated string.
 * @returns The updated string with the new character appended.
 */
function addCharacter(cursor: LexerCursor, expression: string): string {
  cursor.advance();
  return `${expression}${cursor.currentChar.value}`;
}