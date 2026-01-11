import { GRAVE_ACCENT } from "../../costants/chars.constants";
import { isJSIdentifierStart } from "../../utils/chars.utils";
import { Cursor } from "../models/cursor.model";
import { LexerState } from "../models/lexer-state.enum";
import { LexerTransitionFunctionContext } from "../models/transition-function/transition-function-context.type";
import { LexerTransitionFunctionReturnType } from "../models/transition-function/transition-function-return-type.type";

export function consumeInterpolation(cursor: Cursor, _context: LexerTransitionFunctionContext): LexerTransitionFunctionReturnType {
  let retVal!: LexerTransitionFunctionReturnType;

  // Consume '{' characters
  cursor.advance();

  const nextChar = cursor.peek();

  if (nextChar === GRAVE_ACCENT) {
    retVal = { state: LexerState.INTERPOLATION_LITERAL };
  } else if (isJSIdentifierStart(nextChar)) {
    retVal = { state: LexerState.INTERPOLATION_EXPRESSION };
  } else {
    throw new Error(`Unrecognized First Character ${String.fromCharCode(nextChar)} in interpolation`);
  }

  return retVal;
}