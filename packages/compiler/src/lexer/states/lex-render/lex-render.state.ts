import { DOLLAR, LPAREN, NINE, UNDERSCORE, ZERO, A, Z, a, z } from '../../../costants/chars.constant';
import { LexerCursor } from '../../types/lexer-cursor/lexer-cursor.model';
import { LexerState } from '../../types/lexer-state.enum';
import { TokenType } from '../../types/token-type.enum';
import { LexerTransitionFunctionContext } from '../../types/transition-function/transition-function-context.type';
import { LexerTransitionFunctionReturnType } from '../../types/transition-function/transition-function-return-type.type';
import { lexGroup } from '../../utils/group/group.utils';

/**
 * Consumes the call of a template after `@render`, already consumed by the flow-control state, and transitions back
 * to TEXT: the name of the template, then its arguments up to the parenthesis closing them, e.g. `row(item(), 1)` in
 * `@render row(item(), 1)`.
 *
 * @param cursor - The lexer cursor positioned right after `@render `.
 * @param _context - Unused lexer context.
 * @returns Transition result with the RENDER_CALL token, spanning from the name to the closing parenthesis, and the
 *   TEXT state.
 * @throws If the name is empty, or it is not followed by the arguments in parentheses.
 */
export function lexRender(cursor: LexerCursor, _context: LexerTransitionFunctionContext): LexerTransitionFunctionReturnType {
  cursor.skipSpaces();

  const start = cursor.currentChar.index + 1;
  let callee = '';
  while (isIdentifierChar(cursor.peek())) {
    cursor.advance();
    callee = `${callee}${cursor.currentChar.value}`;
  }

  if (!callee || cursor.peek() !== LPAREN) {
    throw '@render calls a template by its name, followed by its arguments in parentheses, e.g. @render row(item())';
  }

  // Consume '('
  cursor.advance();
  const args = lexGroup(cursor, LPAREN);

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
 * Tells whether a character can be part of the name of a template.
 *
 * @param code - The code of the character.
 * @returns `true` for a letter, a digit, `_` or `$`.
 */
function isIdentifierChar(code: number): boolean {
  return (code >= a && code <= z) || (code >= A && code <= Z) || (code >= ZERO && code <= NINE) || code === UNDERSCORE || code === DOLLAR;
}
