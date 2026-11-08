import { EQUAL_THEN, SEMICOLON } from '../../../costants/chars.constant';
import { LexerCursor } from '../../types/lexer-cursor/lexer-cursor.model';
import { LexerState } from '../../types/lexer-state.enum';
import { TokenType } from '../../types/token-type.enum';
import { LexerTransitionFunctionContext } from '../../types/transition-function/transition-function-context.type';
import { LexerTransitionFunctionReturnType } from '../../types/transition-function/transition-function-return-type.type';
import { isIdentifierChar } from '../../utils/chars/chars.utils';
import { lexExpressionText } from '../../utils/expression-text/expression-text.utils';

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
 * Consumes the value of a `@let` up to the `;` ending it, which is consumed too (see `lexExpressionText`).
 *
 * @param cursor - The lexer cursor positioned right after the `=`.
 * @returns The text of the value, without the `;`.
 * @throws If a `}` closes the block enclosing the `@let` before its `;`.
 */
function lexValue(cursor: LexerCursor): string {
  const value = lexExpressionText(cursor, ';}');
  if (cursor.peek() !== SEMICOLON) {
    throw LET_SYNTAX_ERROR;
  }

  // Consume ';'
  cursor.advance();
  return value;
}
