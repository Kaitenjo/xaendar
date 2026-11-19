import { LPAREN } from '../../../costants/chars.constant';
import { LexerCursor } from '../../types/lexer-cursor/lexer-cursor.model';
import { LexerState } from '../../types/lexer-state.enum';
import { TokenType } from '../../types/token-type.enum';
import { LexerTransitionFunctionContext } from '../../types/transition-function/transition-function-context.type';
import { LexerTransitionFunctionReturnType } from '../../types/transition-function/transition-function-return-type.type';
import { lexExpressionText, lexGroup } from '../../utils/expression-text/expression-text.utils';

/**
 * A character of a name.
 */
const IDENTIFIER_CHAR = /^[\w$]/;

/**
 * The start of a member access continuing what a `@render` calls: a dot, or `?.`, followed by a name.
 */
const MEMBER_ACCESS = /^\??\.[\w$]/;

/**
 * Consumes the call of a template after `@render`, already consumed by the flow-control state, and transitions back
 * to TEXT: what is called, then its arguments up to the parenthesis closing them, e.g. `row(item, 1)` in
 * `@render row(item, 1)`. What is called is the name of a template, or an expression whose value is a template: a chain
 * of names, member accesses (`.name`, `?.name`, `[key]`) and calls, e.g. `row()` in `@render row()(item)`, the last
 * group of parentheses holding the arguments. A `.` continues the chain only when a name follows it, so that the text
 * after a `@render` can start with one.
 *
 * @param cursor - The lexer cursor positioned right after `@render `.
 * @param _context - Unused lexer context.
 * @returns Transition result with the RENDER_CALL token, whose parts are what is called and the arguments, spanning from
 *   the start of what is called to the closing parenthesis, and the TEXT state.
 * @throws If nothing is called, or it is not followed by the arguments in parentheses.
 */
export function lexRender(cursor: LexerCursor, _context: LexerTransitionFunctionContext): LexerTransitionFunctionReturnType {
  cursor.skipSpaces();

  const start = cursor.currentChar.index + 1;
  let callee = '';
  // The text of the last group of parentheses read: the arguments, unless the chain goes on
  let args: string | undefined;
  // The characters are matched, not peeked: the template may end right after the call
  for (let read = true; read;) {
    if (args === undefined && cursor.peekMatch(IDENTIFIER_CHAR, 1)) {
      cursor.advance();
      callee = `${callee}${cursor.currentChar.value}`;
    } else if (callee && cursor.peekMatch(MEMBER_ACCESS, 3)) {
      const access = cursor.peekMatch('?.') ? '?.' : '.';
      callee = `${appendCall(callee, args)}${access}`;
      args = undefined;
      cursor.advance(access.length);
    } else if (callee && cursor.peekMatch('(')) {
      callee = appendCall(callee, args);
      // Consume '('
      cursor.advance();
      args = lexGroup(cursor, LPAREN);
    } else if (callee && cursor.peekMatch('[')) {
      callee = appendCall(callee, args);
      args = undefined;
      // Consume '[', then the key, then ']'
      cursor.advance();
      const key = lexExpressionText(cursor, ']');
      cursor.advance();
      callee = `${callee}[${key}]`;
    } else {
      read = false;
    }
  }

  if (!callee || args === undefined) {
    // At the end of the input the call is still being written: peeking reports the end, which leaves the lexer here
    cursor.peek();
    throw '@render calls a template by its name, followed by its arguments in parentheses, e.g. @render row(item), or an expression whose value is a template, e.g. @render row()(item)';
  }

  return {
    state: LexerState.TEXT,
    tokens: [{
      type: TokenType.RENDER_CALL,
      parts: [callee, args],
      span: { start, end: cursor.currentChar.index + 1 }
    }]
  };
}

/**
 * Appends to what is called the group of parentheses read last, which turned out to be a call of the chain instead
 * of the arguments.
 *
 * @param callee - What is called, read so far.
 * @param args - The text of the group read last, if any.
 * @returns What is called, with the call appended.
 */
function appendCall(callee: string, args: string | undefined): string {
  return args === undefined ? callee : `${callee}(${args})`;
}
