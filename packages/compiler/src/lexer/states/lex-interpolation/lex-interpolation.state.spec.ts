import { describe, expect, it } from 'vitest';
import { LexerCursor } from '../../types/lexer-cursor/lexer-cursor.model';
import { LexerState } from '../../types/lexer-state.enum';
import { LexerTransitionFunctionContext } from '../../types/transition-function/transition-function-context.type';
import { lexInterpolation } from './lex-interpolation.state';

const context: LexerTransitionFunctionContext = { history: [], tokens: [] };

describe('lexInterpolation', () => {
  it('transitions to INTERPOLATION_LITERAL when the content starts with a backtick', () => {
    const cursor = new LexerCursor('{`text`}');
    expect(lexInterpolation(cursor, context)).toEqual({ state: LexerState.INTERPOLATION_LITERAL });
  });

  it('transitions to INTERPOLATION_EXPRESSION for anything else', () => {
    const cursor = new LexerCursor('{value}');
    expect(lexInterpolation(cursor, context)).toEqual({ state: LexerState.INTERPOLATION_EXPRESSION });
  });

  it('skips whitespace between { and the interpolation content', () => {
    const cursor = new LexerCursor('{   value}');
    expect(lexInterpolation(cursor, context)).toEqual({ state: LexerState.INTERPOLATION_EXPRESSION });
  });
});
