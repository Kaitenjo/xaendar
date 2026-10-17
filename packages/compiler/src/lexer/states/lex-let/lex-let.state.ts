import { BACKSLASH, DOLLAR, DOUBLE_QUOTE, EQUAL_THEN, GRAVE_ACCENT, LEFT_BRACE, LEFT_BRACKET, LPAREN, RIGHT_BRACE, RIGHT_BRACKET, RPAREN, SEMICOLON, SINGLE_QUOTE } from '../../../costants/chars.constant';
import { LexerCursor } from '../../types/lexer-cursor/lexer-cursor.model';
import { LexerState } from '../../types/lexer-state.enum';
import { TokenType } from '../../types/token-type.enum';
import { LexerTransitionFunctionContext } from '../../types/transition-function/transition-function-context.type';
import { LexerTransitionFunctionReturnType } from '../../types/transition-function/transition-function-return-type.type';
import { isIdentifierChar } from '../../utils/chars/chars.utils';

/**
 * The error of a `@let` that is not written as its name, `=` and its value, ending with a `;`.
 */
export const LET_SYNTAX_ERROR = '@let declares a name and its value, ending with a semicolon, e.g. @let address = user().address;';

/**
 * Consumes the declaration after `@let`, already consumed by the flow-control state, and transitions back to TEXT: the
 * name, the `=` and the value up to the `;` ending it, e.g. `total = price() * quantity();` in
 * `@let total = price() * quantity();`.
 *
 * The value can span several lines: a `;` inside a string, a template literal or a group (`(…)`, `[…]`, `{…}`) doesn't
 * end it.
 *
 * @param cursor - The lexer cursor positioned right after `@let `.
 * @param _context - Unused lexer context.
 * @returns Transition result with the LET_DECLARATION token, spanning from the name to the `;`, and the TEXT state.
 * @throws If the name is empty, it is not followed by `=`, or a `}` closes the block enclosing the `@let` before its `;`.
 */
export function lexLet(cursor: LexerCursor, _context: LexerTransitionFunctionContext): LexerTransitionFunctionReturnType {
  cursor.skipSpaces();

  const start = cursor.currentChar.index + 1;
  let name = '';
  while (isIdentifierChar(cursor.peek())) {
    cursor.advance();
    name = `${name}${cursor.currentChar.value}`;
  }

  cursor.skipSpaces();
  if (!name || cursor.peek() !== EQUAL_THEN) {
    throw LET_SYNTAX_ERROR;
  }

  // Consume '='
  cursor.advance();
  const value = lexValue(cursor);

  return {
    state: LexerState.TEXT,
    tokens: [{
      type: TokenType.LET_DECLARATION,
      parts: [name, value],
      span: { start, end: cursor.currentChar.index + 1 }
    }]
  };
}

/**
 * Consumes the value of a `@let` up to the `;` ending it, which is consumed too.
 *
 * @param cursor - The lexer cursor positioned right after the `=`.
 * @returns The text of the value, without the `;`.
 * @throws If a `}` closes the block enclosing the `@let` before its `;`.
 */
function lexValue(cursor: LexerCursor): string {
  let value = '';
  // The open constructs the cursor is in, innermost last: groups (`(`, `[`, `{` or `${`) and template literals (`` ` ``)
  const nesting = new Array<number>();
  // The quote of the string literal the cursor is in, if any
  let quote: number | null = null;

  while (quote !== null || nesting.length || cursor.peek() !== SEMICOLON) {
    const char = cursor.peek();
    if (quote === null && !nesting.length && char === RIGHT_BRACE) {
      throw LET_SYNTAX_ERROR;
    }

    value = addCharacter(cursor, value);
    if (quote !== null) {
      switch (char) {
        // An escaped character never closes the string
        case BACKSLASH:
          value = addCharacter(cursor, value);
          break;

        case quote:
          quote = null;
          break;
      }
    } else if (nesting.at(-1) === GRAVE_ACCENT) {
      switch (char) {
        // An escaped character never closes the template literal, nor starts a substitution
        case BACKSLASH:
          value = addCharacter(cursor, value);
          break;

        case GRAVE_ACCENT:
          nesting.pop();
          break;

        case DOLLAR:
          if (cursor.peek() === LEFT_BRACE) {
            value = addCharacter(cursor, value);
            nesting.push(LEFT_BRACE);
          }
          break;
      }
    } else {
      switch (char) {
        case SINGLE_QUOTE:
        case DOUBLE_QUOTE:
          quote = char;
          break;

        case GRAVE_ACCENT:
        case LPAREN:
        case LEFT_BRACKET:
        case LEFT_BRACE:
          nesting.push(char);
          break;

        // A closing character without its opening one is reported by the validation of the value
        case RPAREN:
        case RIGHT_BRACKET:
        case RIGHT_BRACE:
          nesting.pop();
          break;
      }
    }
  }

  // Consume ';'
  cursor.advance();
  return value;
}

/**
 * Advances the cursor by one character and appends it to the accumulator string.
 *
 * @param cursor - The lexer cursor to advance.
 * @param value - The current accumulated value.
 * @returns The updated string with the newly consumed character appended.
 */
function addCharacter(cursor: LexerCursor, value: string): string {
  cursor.advance();
  return `${value}${cursor.currentChar.value}`;
}
