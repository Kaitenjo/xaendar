import { AT_SIGN, GREATER_THEN, SLASH, SPACE } from '../../costants/chars.constants.js';
import { LexerCursor } from '../models/lexer-cursor.model.js';
import { LexerState } from '../models/lexer-state.enum.js';
import { LexerTransitionFunctionContext } from '../models/transition-function/transition-function-context.type.js';
import { LexerTransitionFunctionReturnType } from '../models/transition-function/transition-function-return-type.type.js';

export function consumeTagBody(cursor: LexerCursor, _context: LexerTransitionFunctionContext): LexerTransitionFunctionReturnType {
  let read = true;
  let retVal!: LexerTransitionFunctionReturnType;

  while (read) {
    const nextChar = cursor.peek();

    switch (nextChar) {
      case AT_SIGN:
        retVal = {
          state: LexerState.EVENT
        }
        read = false;
        break;

      case SPACE:
        cursor.advance();
        break;

      case GREATER_THEN:
      case SLASH:
        retVal = {
          state: LexerState.TAG_OPEN_END
        }
        read = false;
        break;

      default:
        retVal = {
          state: LexerState.ATTRIBUTE
        }
        read = false;
    }
  }

  return retVal
}