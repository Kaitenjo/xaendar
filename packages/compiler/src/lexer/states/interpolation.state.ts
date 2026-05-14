import { GRAVE_ACCENT } from '../../costants/chars.constants.js';
import { isJSIdentifierStart } from '../../utils/chars.utils.js';
import { LexerCursor } from '../models/lexer-cursor.model.js';
import { LexerState } from '../models/lexer-state.enum.js';
import { LexerTransitionFunctionContext } from '../models/transition-function/transition-function-context.type.js';
import { LexerTransitionFunctionReturnType } from '../models/transition-function/transition-function-return-type.type.js';

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