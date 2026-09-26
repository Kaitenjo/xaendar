import { describe, expect, it } from 'vitest';
import { LexerCursor } from '../../types/lexer-cursor/lexer-cursor.model';
import { LexerState } from '../../types/lexer-state.enum';
import { TokenType } from '../../types/token-type.enum';
import { LexerTransitionFunctionContext } from '../../types/transition-function/transition-function-context.type';
import { lexTagOpenEnd } from './lex-tag-open-end.state';

const context: LexerTransitionFunctionContext = { history: [], tokens: [] };

describe('lexTagOpenEnd', () => {
  it('emits TAG_OPEN_END and transitions to TEXT on >', () => {
    const cursor = new LexerCursor('>');
    expect(lexTagOpenEnd(cursor, context)).toEqual({
      state: LexerState.TEXT,
      tokens: [{ type: TokenType.TAG_OPEN_END, parts: [] }]
    });
  });

  it('emits TAG_SELF_CLOSE and transitions to TEXT on />', () => {
    const cursor = new LexerCursor('/>');
    expect(lexTagOpenEnd(cursor, context)).toEqual({
      state: LexerState.TEXT,
      tokens: [{ type: TokenType.TAG_SELF_CLOSE, parts: [] }]
    });
  });

  it('throws when / is not followed by >', () => {
    const cursor = new LexerCursor('/x');
    expect(() => lexTagOpenEnd(cursor, context)).toThrow('Unexpected character \'x\' after \'/\': expected \'>\' to close self-closing tag');
  });
});
