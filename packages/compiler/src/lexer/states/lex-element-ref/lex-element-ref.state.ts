import { CR, EQUAL_THEN, GREATER_THEN, LF, LPAREN, SLASH, SPACE, TAB } from '../../../costants/chars.constant';
import { LexerCursor } from '../../types/lexer-cursor/lexer-cursor.model';
import { LexerState } from '../../types/lexer-state.enum';
import { TokenType } from '../../types/token-type.enum';
import { LexerTransitionFunctionContext } from '../../types/transition-function/transition-function-context.type';
import { LexerTransitionFunctionReturnType } from '../../types/transition-function/transition-function-return-type.type';

/**
 * Consumes an element ref, after the `#` already consumed by the tag body, and transitions back to TAG_BODY: `#name`
 * names the element it is declared on, e.g. `<input #name />`.
 *
 * @param cursor - The lexer cursor positioned right after `#`.
 * @param _context - Unused lexer context.
 * @returns Transition result with the ELEMENT_REF token and the TAG_BODY state.
 * @throws If the name is empty, or followed by parentheses or a value.
 */
export function lexElementRef(cursor: LexerCursor, _context: LexerTransitionFunctionContext): LexerTransitionFunctionReturnType {
  let read = true;
  let name = '';
  let retVal!: LexerTransitionFunctionReturnType;

  while (read) {
    switch (cursor.peek()) {
      // A tag can span multiple lines: the name can also be followed by a tab or a line break
      case SPACE:
      case TAB:
      case LF:
      case CR:
      case GREATER_THEN:
      case SLASH:
        assertName(name);
        retVal = {
          state: LexerState.TAG_BODY,
          tokens: [{ type: TokenType.ELEMENT_REF, parts: [name] }]
        };
        read = false;
        break;

      case LPAREN:
        throw 'An element ref is just #name, without parentheses';

      case EQUAL_THEN:
        throw 'An element ref takes no value: write #name, which names the element it is declared on';

      default:
        cursor.advance();
        name = `${name}${cursor.currentChar.value}`;
    }
  }

  return retVal;
}

/**
 * Ensures the name of an element ref is not empty.
 *
 * @param name - The name read so far.
 * @throws If the name is empty.
 */
function assertName(name: string): void {
  if (!name) {
    throw 'An element ref needs a name, e.g. #name';
  }
}
