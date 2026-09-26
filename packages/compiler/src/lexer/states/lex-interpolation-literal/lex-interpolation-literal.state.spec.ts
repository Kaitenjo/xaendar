import { describe, expect, it } from 'vitest';
import { LexerCursor } from '../../types/lexer-cursor/lexer-cursor.model';
import { LexerState } from '../../types/lexer-state.enum';
import { TokenType } from '../../types/token-type.enum';
import { LexerTransitionFunctionContext } from '../../types/transition-function/transition-function-context.type';
import { lexInterpolationliteral } from './lex-interpolation-literal.state';

describe('lexInterpolationliteral', () => {
  it('restores the TEXT state for a simple template literal', () => {
    const cursor = new LexerCursor('`text`}');
    const context: LexerTransitionFunctionContext = { history: [LexerState.TEXT], tokens: [] };
    expect(lexInterpolationliteral(cursor, context)).toEqual({
      state: LexerState.TEXT,
      tokens: [{ type: TokenType.INTERPOLATION_LITERAL, parts: ['`text`'] }],
      popState: true
    });
  });

  it('restores the TAG_BODY state', () => {
    const cursor = new LexerCursor('`text`}');
    const context: LexerTransitionFunctionContext = { history: [LexerState.TAG_BODY], tokens: [] };
    expect(lexInterpolationliteral(cursor, context).state).toBe(LexerState.TAG_BODY);
  });

  it('treats a backtick not followed by } as part of the literal', () => {
    const cursor = new LexerCursor('`ab`cd`}');
    const context: LexerTransitionFunctionContext = { history: [LexerState.TEXT], tokens: [] };
    expect(lexInterpolationliteral(cursor, context).tokens).toEqual([
      { type: TokenType.INTERPOLATION_LITERAL, parts: ['`ab``cd`'] }
    ]);
  });

  it('consumes the trailing double quote and restores TAG_BODY for an ATTRIBUTE interpolation', () => {
    const cursor = new LexerCursor('`text`}"');
    const context: LexerTransitionFunctionContext = { history: [LexerState.ATTRIBUTE], tokens: [] };
    expect(lexInterpolationliteral(cursor, context).state).toBe(LexerState.TAG_BODY);
  });

  it('restores DYNAMIC_BINDING_BODY for an ATTRIBUTE interpolation nested in a dynamic binding', () => {
    const cursor = new LexerCursor('`text`}"');
    const context: LexerTransitionFunctionContext = { history: [LexerState.DYNAMIC_BINDING_START, LexerState.ATTRIBUTE], tokens: [] };
    expect(lexInterpolationliteral(cursor, context).state).toBe(LexerState.DYNAMIC_BINDING_BODY);
  });

  it('throws when an ATTRIBUTE interpolation is not followed by a double quote', () => {
    const cursor = new LexerCursor('`text`}x');
    const context: LexerTransitionFunctionContext = { history: [LexerState.ATTRIBUTE], tokens: [] };
    expect(() => lexInterpolationliteral(cursor, context)).toThrow('Attribute interpolation expression must end with double quotes \'"\', found \'x\'');
  });

  it('throws for an unexpected previous state', () => {
    const cursor = new LexerCursor('`text`}');
    const context: LexerTransitionFunctionContext = { history: [LexerState.EVENT], tokens: [] };
    expect(() => lexInterpolationliteral(cursor, context)).toThrow('Unexpected state \'event\' after interpolation literal');
  });
});
