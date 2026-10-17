import { LPAREN } from '../../../costants/chars.constant';
import { LexerCursor } from '../../types/lexer-cursor/lexer-cursor.model';
import { LexerTransitionFunctionContext } from '../../types/transition-function/transition-function-context.type';
import { lexGroup } from '../group/group.utils';

/**
 * Consumes a parenthesised flow-control condition expression from the cursor.
 *
 * Skips leading whitespace, then expects `(` followed by a balanced
 * parenthesised expression. Handles nested parentheses and the ones inside strings,
 * and returns the raw expression string (excluding the outer `(` and `)`).
 *
 * @param cursor - The lexer cursor positioned before the opening `(`.
 * @param _context - Unused lexer context (kept for signature consistency).
 * @returns The raw expression string extracted from inside the parentheses.
 * @throws When the next non-space character is not `(`.
 */
export function lexFlowControlCondition(cursor: LexerCursor, _context: LexerTransitionFunctionContext): string {
  cursor.skipSpaces();

  if (cursor.peek() !== LPAREN) {
    throw `Expected '(' but got '${String.fromCharCode(cursor.peek())}'`;
  }

  // consume '('
  cursor.advance();
  return lexGroup(cursor, LPAREN);
}
