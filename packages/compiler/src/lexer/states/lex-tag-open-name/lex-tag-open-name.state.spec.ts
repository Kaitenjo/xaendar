import { describe, expect, it } from 'vitest';
import { LexerCursor } from '../../types/lexer-cursor/lexer-cursor.model';
import { LexerState } from '../../types/lexer-state.enum';
import { TokenType } from '../../types/token-type.enum';
import { LexerTransitionFunctionContext } from '../../types/transition-function/transition-function-context.type';
import { lexTagOpenName } from './lex-tag-open-name.state';

const context: LexerTransitionFunctionContext = { history: [], tokens: [] };

describe('lexTagOpenName', () => {
  it('reads a tag name terminated by a space', () => {
    const cursor = new LexerCursor('<div class="a">');
    const result = lexTagOpenName(cursor, context);
    expect(result).toEqual({
      state: LexerState.TAG_BODY,
      tokens: [{ type: TokenType.TAG_OPEN_NAME, parts: ['div'] }],
      pushState: true
    });
  });

  it.each([
    ['a tab', '\t'],
    ['a line feed', '\n'],
    ['a carriage return', '\r']
  ])('reads a tag name terminated by %s, leaving it to the tag body', (_description, whitespace) => {
    const cursor = new LexerCursor(`<div${whitespace}class="a">`);
    const result = lexTagOpenName(cursor, context);
    expect(result).toEqual({
      state: LexerState.TAG_BODY,
      tokens: [{ type: TokenType.TAG_OPEN_NAME, parts: ['div'] }],
      pushState: true
    });
    expect(cursor.peek()).toBe(whitespace.charCodeAt(0));
  });

  it('reads a tag name terminated by a slash', () => {
    const cursor = new LexerCursor('<br/>');
    const result = lexTagOpenName(cursor, context);
    expect(result.tokens?.[0]).toEqual({ type: TokenType.TAG_OPEN_NAME, parts: ['br'] });
  });

  it('reads a tag name terminated directly by >', () => {
    const cursor = new LexerCursor('<span>');
    const result = lexTagOpenName(cursor, context);
    expect(result.tokens?.[0]).toEqual({ type: TokenType.TAG_OPEN_NAME, parts: ['span'] });
  });

  it('skips whitespace between < and the tag name', () => {
    const cursor = new LexerCursor('<   div>');
    const result = lexTagOpenName(cursor, context);
    expect(result.tokens?.[0]).toEqual({ type: TokenType.TAG_OPEN_NAME, parts: ['div'] });
  });

  it('skips tabs and line breaks between < and the tag name', () => {
    const cursor = new LexerCursor('<\r\n\tdiv>');
    const result = lexTagOpenName(cursor, context);
    expect(result.tokens?.[0]).toEqual({ type: TokenType.TAG_OPEN_NAME, parts: ['div'] });
  });

  it('throws when the tag name is empty', () => {
    const cursor = new LexerCursor('< >');
    expect(() => lexTagOpenName(cursor, context)).toThrow('Tag name cannot be empty ');
  });

  it.each([
    ['one type, followed by a space', '<my-list(string) items="x">', 'string', ' '],
    ['several types, followed by >', '<my-list(string, number)>', 'string, number', '>'],
    ['nested generic and function types, followed by a line break', '<my-list(Map<string, number>, (value: string) => void)\n>', 'Map<string, number>, (value: string) => void', '\n'],
    ['a literal type holding a parenthesis, on a self-closing tag', '<my-list(\'a)b\')/>', '\'a)b\'', '/']
  ])('emits the type arguments as the second part of the token, for %s', (_description, input, typeArguments, next) => {
    const cursor = new LexerCursor(input);

    expect(lexTagOpenName(cursor, context)).toEqual({
      state: LexerState.TAG_BODY,
      tokens: [{ type: TokenType.TAG_OPEN_NAME, parts: ['my-list', typeArguments] }],
      pushState: true
    });
    expect(cursor.peek()).toBe(next.charCodeAt(0));
  });

  it.each([
    ['empty type arguments', '<my-list()>', 'Type arguments cannot be empty'],
    ['type arguments without a tag name', '<(string)>', 'Tag name cannot be empty '],
    ['type arguments declared twice', '<my-list(string)(number)>', 'An element can declare its type arguments only once, right after its tag name'],
    ['something right after the type arguments', '<my-list(string)x>', 'The type arguments of an element must be followed by a whitespace, / or >']
  ])('throws for %s', (_description, input, message) => {
    expect(() => lexTagOpenName(new LexerCursor(input), context)).toThrow(message);
  });
});
