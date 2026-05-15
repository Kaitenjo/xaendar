import { GREATER_THEN, SPACE } from '../../costants/chars.constants.js';
import { LexerCursor } from '../models/lexer-cursor.model.js';
import { LexerState } from '../models/lexer-state.enum.js';
import { TokenType } from '../models/token-type.enum.js';
import { LexerTransitionFunctionContext } from '../models/transition-function/transition-function-context.type.js';
import { LexerTransitionFunctionReturnType } from '../models/transition-function/transition-function-return-type.type.js';

export function consumeTagClose(cursor: LexerCursor, _context: LexerTransitionFunctionContext): LexerTransitionFunctionReturnType {
  let read = true;
  let tagName = '';
  let retVal!: LexerTransitionFunctionReturnType;

  // Skip '</'
  cursor.advance(2);

  /*
    Skip all the spaces between '</' and the actual tag name
    Ex: '</         div>
  */
  cursor.skipSpaces();

  while (read) {
    switch (cursor.peek()) {
      case GREATER_THEN:
        cursor.advance();
        retVal = {
          state: LexerState.TEXT,
          tokens: [{
            type: TokenType.TAG_CLOSE_NAME, 
            parts: [tagName]
          }]
        };
        read = false;
        break;

      case SPACE:
        throw new Error('Tag Close Name cannot contains spaces');

      default:
        cursor.advance();
        tagName = `${tagName}${cursor.currentChar.value}`;
    }
  }

  return retVal;
}