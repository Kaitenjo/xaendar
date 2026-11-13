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
    ['a call', '@render row()(item) tail', 'row()', 'item'],
    ['member accesses', '@render templates.rows?.first(item) tail', 'templates.rows?.first', 'item'],
    ['a key', '@render rows[kind()](item)', 'rows[kind()]', 'item'],
    ['calls and accesses after a call', '@render pick(a)[0].row(b)?.inner(c)(item)', 'pick(a)[0].row(b)?.inner(c)', 'item']
  ])('reads an expression whose value is a template, made of %s, up to the last group of parentheses', (_description, input, callee, args) => {
    const cursor = afterKeyword(input);
    expect(lexRender(cursor, context)).toMatchObject({ tokens: [{ type: TokenType.RENDER_CALL, parts: [callee, args], span: { start: 8, end: 8 + callee.length + args.length + 2 } }] });
  });

  it.each([
    ['a dot followed by no name', '@render row(item). Next', '.'],
    ['a question mark followed by no dot', '@render row(item)? Next', '?'],
    ['a question mark and a dot followed by no name', '@render row(item)?. Next', '?'],
    ['a name', '@render row(item)tail', 't']
  ])('ends the call before %s', (_description, input, next) => {
    const cursor = afterKeyword(input);
    expect(lexRender(cursor, context)).toMatchObject({ tokens: [{ parts: ['row', 'item'] }] });
    expect(cursor.peek()).toBe(next.charCodeAt(0));
  });

  it.each([
    ['the name', '@render ro'],
    ['a member access', '@render templates.ro'],
    ['nothing', '@render ']
  ])('reports the end of the input reached while %s of the call is written', (_description, input) => {
    expect(() => lexRender(afterKeyword(input), context)).toThrow(expect.objectContaining({ message: '' }));
  });

  it.each([
    ['the name is missing', '@render (item())'],
    ['the arguments are missing', '@render row\n<p />'],
    ['a whitespace separates the name from the arguments', '@render row (item())'],
    ['the chain ends with a member access', '@render row().inner\n<p />'],
    ['the chain ends with a key', '@render rows[0]\n<p />']
  ])('throws when %s', (_description, input) => {
    expect(() => lexRender(afterKeyword(input), context)).toThrow('@render calls a template by its name, followed by its arguments in parentheses, e.g. @render row(item), or an expression whose value is a template, e.g. @render row()(item)');
  });
});
