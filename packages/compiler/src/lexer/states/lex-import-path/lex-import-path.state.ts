import { DOUBLE_QUOTE, SINGLE_QUOTE } from '../../../costants/chars.constant';
import { LexerCursor } from '../../types/lexer-cursor/lexer-cursor.model';
import { LexerState } from '../../types/lexer-state.enum';
import { TokenType } from '../../types/token-type.enum';
import { LexerTransitionFunctionContext } from '../../types/transition-function/transition-function-context.type';
import { LexerTransitionFunctionReturnType } from '../../types/transition-function/transition-function-return-type.type';

/**
 * What follows the path of a statement when it ends with a `;`: spaces or tabs, then the `;`.
 */
const STATEMENT_END = /^[ \t]*;/;

export function lexImportPath(cursor: LexerCursor, _context: LexerTransitionFunctionContext): LexerTransitionFunctionReturnType {
  let read = true;
  let path = '';
  let retVal!: LexerTransitionFunctionReturnType
  let singleQuote = false;

  /*
    Skip all the spaces between '}' and the from
      |
      ˅
    }    from
  */
  cursor.skipSpaces();

  if (!cursor.peekMatch('from')) {
    throw 'Expected \'from\' keyword after import list';
  }

  cursor.advance(4);

  /*
    Skip all the spaces between from and the path delimiter
          |
          ˅
    from    'my/path/...'
  */
  cursor.skipSpaces();


  // Consume ' or "
  cursor.advance();
  
  switch (cursor.currentChar.code) {
    case SINGLE_QUOTE:
      singleQuote = true;
      break;

    case DOUBLE_QUOTE:
      break;
    
    default:
      throw `Import statement must start with ' or ".\nFound character ${cursor.currentChar.value}`;
  }

  const delimiter = singleQuote ? SINGLE_QUOTE : DOUBLE_QUOTE;

  while (read) {
    switch (cursor.peek()) {
      case delimiter:
        cursor.advance();
        // The `;` closing the statement, as in JavaScript, is part of it with the spaces before it: it is not a text of the template
        if (cursor.peekMatch(STATEMENT_END, Infinity)) {
          cursor.skipSpaces();
          cursor.advance();
        }

        read = false;
        retVal = {
          state: LexerState.TEXT,
          tokens: [{
            type: TokenType.IMPORT_PATH,
            parts: [path]
          }]
        }
        break;
      
      default: 
        cursor.advance();
        path = `${path}${cursor.currentChar.value}`;
    }
  }


  return retVal
}