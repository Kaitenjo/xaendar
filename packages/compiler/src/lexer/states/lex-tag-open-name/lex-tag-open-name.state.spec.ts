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

  it('throws when the tag name is empty', () => {
    const cursor = new LexerCursor('< >');
    expect(() => lexTagOpenName(cursor, context)).toThrow('Tag name cannot be empty ');
  });
});
