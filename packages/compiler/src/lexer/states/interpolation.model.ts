import { Cursor } from "../models/cursor.model";
import { LexerState } from "../models/lexer-state.enum";
import { Token } from "../models/token.type";
import { LexerTransitionFunctionReturnType } from "../models/transition-function-return-type.type";

export function consumeInterpolation(cursor: Cursor): LexerTransitionFunctionReturnType {
  const tokens = new Array<Token>;

  return {
    state: LexerState.TEXT,
    tokens
  }
}