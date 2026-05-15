import { LEFT_BRACE } from "../../costants/chars.constants.js";
import { LexerCursor } from "../models/lexer-cursor.model.js";
import { LexerState } from "../models/lexer-state.enum.js";
import { TokenType } from "../models/token-type.enum.js";
import { LexerTransitionFunctionContext } from "../models/transition-function/transition-function-context.type.js";
import { LexerTransitionFunctionReturnType } from "../models/transition-function/transition-function-return-type.type.js";

/**
 * Consumes the opening `{` of a flow control block body,
 * skipping any leading whitespace before it.
 *
 * Emits a BLOCK_OPEN token and transitions to TEXT,
 * pushing FLOW_CONTROL_BLOCK onto the state stack.
 * This allows consumeText to later recognise the matching `}` as a BLOCK_CLOSE
 * rather than as an interpolation boundary.
 *
 * Used by: @if, @for, @switch, @case, @else, @default
 */
export function consumeFlowControlBlock(cursor: LexerCursor, _context: LexerTransitionFunctionContext): LexerTransitionFunctionReturnType {
  cursor.skipSpaces();

  if (cursor.peek() !== LEFT_BRACE) {
    throw new Error(`Expected '{' but got '${String.fromCharCode(cursor.peek())}' at row ${cursor.position.row}, col ${cursor.position.column}`);
  }

  // consume '{'
  cursor.advance();

  return {
    state: LexerState.TEXT,
    tokens: [{ type: TokenType.BLOCK_OPEN }],
    pushState: true
  };
}
