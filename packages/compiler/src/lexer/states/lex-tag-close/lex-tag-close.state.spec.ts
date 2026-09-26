import { describe, expect, it } from 'vitest';
import { LexerCursor } from '../../types/lexer-cursor/lexer-cursor.model';
import { LexerState } from '../../types/lexer-state.enum';
import { TokenType } from '../../types/token-type.enum';
import { LexerTransitionFunctionContext } from '../../types/transition-function/transition-function-context.type';
import { lexTagClose } from './lex-tag-close.state';

const context: LexerTransitionFunctionContext = { history: [], tokens: [] };

describe('lexTagClose', () => {
  it('reads a closing tag name', () => {
    const cursor = new LexerCursor('</div>');
    expect(lexTagClose(cursor, context)).toEqual({
      state: LexerState.TEXT,
      tokens: [{ type: TokenType.TAG_CLOSE_NAME, parts: ['div'] }]
    });
  });

  it('skips whitespace between </ and the tag name', () => {
    const cursor = new LexerCursor('</   div>');
    expect(lexTagClose(cursor, context)).toEqual({
      state: LexerState.TEXT,
      tokens: [{ type: TokenType.TAG_CLOSE_NAME, parts: ['div'] }]
    });
  });

  it('throws when the closing tag name is empty', () => {
    const cursor = new LexerCursor('</>');
    expect(() => lexTagClose(cursor, context)).toThrow('Tag close name cannot be empty');
  });

  it('throws when the closing tag name contains a space', () => {
    const cursor = new LexerCursor('</di v>');
    expect(() => lexTagClose(cursor, context)).toThrow('Tag close name cannot contain spaces');
  });
});
