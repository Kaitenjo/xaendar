import { describe, expect, it } from 'vitest';
import { LexerCursor } from '../../types/lexer-cursor/lexer-cursor.model';
import { LexerState } from '../../types/lexer-state.enum';
import { LexerTransitionFunctionContext } from '../../types/transition-function/transition-function-context.type';
import { lexInterpolation } from './lex-interpolation.state';

const context: LexerTransitionFunctionContext = { history: [], tokens: [] };

describe('lexInterpolation', () => {
  it.each([
    ['an expression', '{value}'],
    ['a template literal', '{`text`}'],
    ['a template literal after a space', '{ `text` }']
  ])('transitions to INTERPOLATION_EXPRESSION for %s', (_name, input) => {
    expect(lexInterpolation(new LexerCursor(input), context)).toEqual({ state: LexerState.INTERPOLATION_EXPRESSION });
  });

  it('skips whitespace between { and the interpolation content', () => {
    const cursor = new LexerCursor('{   value}');
    lexInterpolation(cursor, context);
    expect(cursor.peekMatch('value}')).toBe(true);
  });
});
