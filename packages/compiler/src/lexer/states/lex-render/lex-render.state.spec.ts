import { describe, expect, it } from 'vitest';
import { LexerCursor } from '../../types/lexer-cursor/lexer-cursor.model';
import { LexerState } from '../../types/lexer-state.enum';
import { TokenType } from '../../types/token-type.enum';
import { LexerTransitionFunctionContext } from '../../types/transition-function/transition-function-context.type';
import { lexRender } from './lex-render.state';

const context: LexerTransitionFunctionContext = { history: [], tokens: [] };

/**
 * Creates a cursor positioned right after the `@render ` of the given input, as the flow-control state leaves it.
 */
function afterKeyword(input: string): LexerCursor {
  const cursor = new LexerCursor(input);
  cursor.advance('@render '.length);
  return cursor;
}

describe('lexRender', () => {
  it('emits the name and the arguments of the call, spanning from the name to the closing parenthesis, and goes back to TEXT', () => {
    const cursor = afterKeyword('@render row(item(), \'a)\', (1 + 2)) tail');
    expect(lexRender(cursor, context)).toEqual({
      state: LexerState.TEXT,
      tokens: [{ type: TokenType.RENDER_CALL, parts: ['row', 'item(), \'a)\', (1 + 2)'], span: { start: 8, end: 34 } }]
    });
    expect(cursor.peek()).toBe(' '.charCodeAt(0));
  });

  it('skips the whitespace before the name, and reads names with digits, _ and $', () => {
    const cursor = afterKeyword('@render \n  $row_2()');
    expect(lexRender(cursor, context)).toEqual({
      state: LexerState.TEXT,
      tokens: [{ type: TokenType.RENDER_CALL, parts: ['$row_2', ''], span: { start: 11, end: 19 } }]
    });
  });

  it.each([
    ['the name is missing', '@render (item())'],
    ['the arguments are missing', '@render row\n<p />'],
    ['a whitespace separates the name from the arguments', '@render row (item())'],
    ['the name is not an identifier', '@render row.inner(item())']
  ])('throws when %s', (_description, input) => {
    expect(() => lexRender(afterKeyword(input), context)).toThrow('@render calls a template by its name, followed by its arguments in parentheses, e.g. @render row(item())');
  });
});
