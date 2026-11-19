import { CR, GREATER_THEN, LF, LPAREN, SLASH, SPACE, TAB } from '../../../costants/chars.constant';
import { LexerCursor } from '../../types/lexer-cursor/lexer-cursor.model';
import { LexerState } from '../../types/lexer-state.enum';
import { TokenType } from '../../types/token-type.enum';
import type { MaybeTokenWithSpan } from '../../types/maybe-token-with-span.type';
import type { TagOpenNameToken } from '../../types/tokens/tag-open-name-token.type';
import { LexerTransitionFunctionContext } from '../../types/transition-function/transition-function-context.type';
import { LexerTransitionFunctionReturnType } from '../../types/transition-function/transition-function-return-type.type';
import { lexTypeArguments } from '../../utils/type-arguments/type-arguments.utils';

/**
 * Consumes an opening tag name after `<`, reading until a whitespace, `/`, or `>` is found.
 * Emits a TAG_OPEN_NAME token with the tag name and transitions to TAG_BODY.
 *
 * The tag name of a generic web component can be followed by its type arguments between parentheses,
 * e.g. `<my-list(string, number)`: their text is the second part of the token.
 *
 * @param cursor - The lexer cursor positioned at the `<` character.
 * @param _context - Unused lexer context.
 * @returns Transition result with the TAG_OPEN_NAME token and the TAG_BODY state.
 * @throws If the tag name is empty, or its type arguments are empty, declared twice or not followed by a whitespace, `/` or `>`.
 */
export function lexTagOpenName(cursor: LexerCursor, _context: LexerTransitionFunctionContext): LexerTransitionFunctionReturnType {
  let read = true;
  let tagName = '';
  let typeArguments: string | undefined;
  let retVal!: LexerTransitionFunctionReturnType

  // Consume '<' character
  cursor.advance();

  /*
    Skip all the spaces between '<' and the actual tag name
    Ex: '<         div>
  */
  cursor.skipSpaces();

  /*
    Keep read input until:
    - Space, tab or line break (a tag can span multiple lines): <span
    - GT: <span>
    - Slash (Self Closing tag) <span / or <span/
  */
  while (read) {
    switch (cursor.peek()) {
      case SPACE:
      case TAB:
      case LF:
      case CR:
      case SLASH:
      case GREATER_THEN:
        assertTagName(tagName);
        retVal = {
          state: LexerState.TAG_BODY,
          tokens: [toTagOpenNameToken(tagName, typeArguments)],
          pushState: true
        }
        read = false;
        break;

      case LPAREN:
        assertTagName(tagName);
        if (typeArguments !== undefined) {
          throw 'An element can declare its type arguments only once, right after its tag name';
        }

        // Consume '('
        cursor.advance();
        typeArguments = lexTypeArguments(cursor, LPAREN);
        break;

      default:
        if (typeArguments !== undefined) {
          throw 'The type arguments of an element must be followed by a whitespace, / or >, e.g. <my-list(string) items="{rows()}">';
        }

        cursor.advance();
        tagName = `${tagName}${cursor.currentChar.value}`
    }
  }

  return retVal
}

/**
 * Builds the token of an opening tag name.
 *
 * @param tagName - The tag name.
 * @param typeArguments - The text of the type arguments, if the element declares them.
 * @returns The token, whose second part is the text of the type arguments only when the element declares them.
 */
function toTagOpenNameToken(tagName: string, typeArguments: string | undefined): MaybeTokenWithSpan<TagOpenNameToken> {
  return typeArguments === undefined ? { type: TokenType.TAG_OPEN_NAME, parts: [tagName] } : { type: TokenType.TAG_OPEN_NAME, parts: [tagName, typeArguments] };
}

/**
 * Ensures a tag name is not empty.
 *
 * @param tagName - The tag name read so far.
 * @throws If the tag name is empty.
 */
function assertTagName(tagName: string): void {
  if (!tagName) {
    throw 'Tag name cannot be empty ';
  }
}
