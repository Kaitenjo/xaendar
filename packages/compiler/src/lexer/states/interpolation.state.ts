import { GRAVE_ACCENT, SPACE } from "../../costants/chars.constants";
import { isJSIdentifierStart } from "../../utils/chars.utils";
import { LexerCursor } from "../models/lexer-cursor.model";
import { LexerState } from "../models/lexer-state.enum";
import { LexerTransitionFunctionContext } from "../models/transition-function/transition-function-context.type";
import { LexerTransitionFunctionReturnType } from "../models/transition-function/transition-function-return-type.type";

export function consumeInterpolation(cursor: LexerCursor, _context: LexerTransitionFunctionContext): LexerTransitionFunctionReturnType {
  let retVal!: LexerTransitionFunctionReturnType;

  // Consume '{' characters
  cursor.advance();

  /*
    Skip all the spaces between '{' and the actual interpolation content
    Ex: '{         label}
  */
  cursor.skipSpaces();
  
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