import { describe, expect, it } from 'vitest';
import { Lexer } from '../../lexer/lexer';
import { LexerCursor } from '../../types/lexer-cursor/lexer-cursor.model';
import { LexerState } from '../../types/lexer-state.enum';
import { TokenType } from '../../types/token-type.enum';
import { LexerTransitionFunctionContext } from '../../types/transition-function/transition-function-context.type';
import { LET_SYNTAX_ERROR, lexLet } from './lex-let.state';

const context: LexerTransitionFunctionContext = { history: [], tokens: [] };

/**
 * Creates a cursor positioned right after the `@let ` of the given input, as the flow-control state leaves it.
 */
function afterKeyword(input: string): LexerCursor {
  const cursor = new LexerCursor(input);
  cursor.advance('@let '.length);
  return cursor;
}

describe('lexLet', () => {
  it('emits the name and the value, spanning from the name to the semicolon, and goes back to TEXT', () => {
    const cursor = afterKeyword('@let total = price() * quantity(); tail');
    expect(lexLet(cursor, context)).toEqual({
      state: LexerState.TEXT,
      tokens: [{ type: TokenType.LET_DECLARATION, parts: ['total', ' price() * quantity()'], span: { start: 5, end: 34 } }]
    });
    expect(cursor.peek()).toBe(' '.charCodeAt(0));
  });

  it('skips the whitespace around the name, and reads names with digits, _ and $', () => {
    const cursor = afterKeyword('@let \n  $total_2\n=1;');
    expect(lexLet(cursor, context)).toEqual({
      state: LexerState.TEXT,
      tokens: [{ type: TokenType.LET_DECLARATION, parts: ['$total_2', '1'], span: { start: 8, end: 20 } }]
    });
  });

  it.each([
    ['strings', '\'a;\' + "b;" + \'c\\\';\''],
    ['template literals and their substitutions', '`a; ${ { b: \';\' }.b } \\`; $c;`'],
    ['groups', 'f(a, (b; c)) + [d;][0] + { e: 1; }.e'],
    ['line breaks', 'a\n  + b']
  ])('reads the semicolons and the closing characters inside %s as part of the value', (_description, value) => {
    const cursor = afterKeyword(`@let x = ${value};`);
    const { tokens } = lexLet(cursor, context);
    expect(tokens).toEqual([expect.objectContaining({ parts: ['x', ` ${value}`] })]);
  });

  it('reads a closing character without its opening one as part of the value', () => {
    const { tokens } = lexLet(afterKeyword('@let x = a) + b];'), context);
    expect(tokens).toEqual([expect.objectContaining({ parts: ['x', ' a) + b]'] })]);
  });

  it.each([
    ['the name is missing', '@let = 1;'],
    ['the = is missing', '@let total 1;'],
    ['the name is not an identifier', '@let total.value = 1;'],
    ['a } closes the block before the semicolon', '@let total = 1 }']
  ])('throws when %s', (_description, input) => {
    expect(() => lexLet(afterKeyword(input), context)).toThrow(LET_SYNTAX_ERROR);
  });

  it('is reached from the content of the template, and stops at the end of the input when the semicolon is missing', () => {
    expect(new Lexer('<p>@let a = 1;</p>').tokenize().map(({ type }) => type)).toEqual([
      TokenType.TAG_OPEN_NAME, TokenType.TAG_OPEN_END, TokenType.LET, TokenType.LET_DECLARATION, TokenType.TAG_CLOSE_NAME
    ]);
    expect(new Lexer('@let a = 1').tokenize().map(({ type }) => type)).toEqual([TokenType.LET]);
  });
});
