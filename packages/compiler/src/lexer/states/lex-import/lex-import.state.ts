import { COMMA, LEFT_BRACE, RIGHT_BRACE, SPACE } from '../../../costants/chars.constant';
import { LexerCursor } from '../../types/lexer-cursor/lexer-cursor.model';
import { LexerState } from '../../types/lexer-state.enum';
import { TokenType } from '../../types/token-type.enum';
import type { ImportToken } from '../../types/tokens/import-token.type';
import { LexerTransitionFunctionContext } from '../../types/transition-function/transition-function-context.type';
import { LexerTransitionFunctionReturnType } from '../../types/transition-function/transition-function-return-type.type';

/**
 * The `lazy` modifier of an `@import`, followed by the brace or by spaces.
 */
const LAZY_KEYWORD = /^lazy(?=[\s{])/;

export function lexImport(cursor: LexerCursor, _context: LexerTransitionFunctionContext): LexerTransitionFunctionReturnType {
  let read = true;
  let importValue = '';
  let importStart = cursor.currentChar.index + 1;
  const retVal: LexerTransitionFunctionReturnType = {
    state: LexerState.IMPORT_PATH,
    tokens: []
  }

  /*
    Skip all the spaces between @import and the '{'
            |
            ˅
    @import   { ...
  */
  cursor.skipSpaces();

  /*
    The modifier is written between @import and the '{'; the symbols are checked, not imported by the template
    module, so the bundler can load them on demand
           |
           ˅
    @import lazy { ...
  */
  const lazy = cursor.peekMatch(LAZY_KEYWORD, 5);
  if (lazy) {
    cursor.advance(4);
    cursor.skipSpaces();
  }

  cursor.advance();
  if (cursor.currentChar.code !== LEFT_BRACE) {
    throw 'Expected { after @import';
  }

  while (read) {
    switch (cursor.peek()) {
      case SPACE:
        cursor.skipSpaces();

        /*
          If import is not followed by ',' or '{' it means it would be followed by 
          the 'as' keyword to alias it
        */
        if (importValue && cursor.peek() !== COMMA && cursor.peek() !== RIGHT_BRACE) {
          importValue = `${importValue} `;
        }
        break;

      case COMMA:
        addImport(retVal, cursor, importValue, importStart, lazy);
        importValue = '';
        importStart = cursor.currentChar.index + 1;
        break;

      case RIGHT_BRACE:
        addImport(retVal, cursor, importValue, importStart, lazy);
        read = false;
        break;

      default:
        cursor.advance();
        importValue = `${importValue}${cursor.currentChar.value}`;
    }
  }

  return retVal
}

function addImport(retVal: LexerTransitionFunctionReturnType, cursor: LexerCursor, value: string, start: number, lazy: boolean): void {
  const end = cursor.currentChar.index + 1;
  cursor.advance();
  const token: ImportToken = {
    type: TokenType.IMPORT,
    parts: [value],
    span: {
      start,
      end
    }
  };
  if (lazy) {
    token.lazy = true;
  }

  retVal.tokens!.push(token);
}