import { describe, expect, it } from 'vitest';
import { LexerCursor } from '../../types/lexer-cursor/lexer-cursor.model';
import { LexerState } from '../../types/lexer-state.enum';
import type { LexerTransitionFunctionContext } from '../../types/transition-function/transition-function-context.type';
import { closeInterpolation } from './interpolation.utils';

describe('closeInterpolation', () => {
  const context = (...history: LexerState[]): LexerTransitionFunctionContext => ({ history, tokens: [] });

  it('consumes the closing brace and returns to the text or the body of the tag', () => {
    const cursor = new LexerCursor('}<');

    expect(closeInterpolation(cursor, context(LexerState.TEXT))).toBe(LexerState.TEXT);
    expect(cursor.currentChar.value).toBe('}');
    expect(closeInterpolation(new LexerCursor('} '), context(LexerState.TAG_BODY))).toBe(LexerState.TAG_BODY);
  });

  it('consumes the double quote closing the value of an attribute, and returns to the bindings of the tag', () => {
    const cursor = new LexerCursor('}" ');

    expect(closeInterpolation(cursor, context(LexerState.ATTRIBUTE))).toBe(LexerState.TAG_BODY);
    expect(cursor.currentChar.value).toBe('"');
    expect(closeInterpolation(new LexerCursor('}" '), context(LexerState.FLOW_CONTROL_BLOCK, LexerState.ATTRIBUTE))).toBe(LexerState.CONDITIONAL_BINDING_BODY);
  });

  it('throws when the value of an attribute is not closed right after the interpolation', () => {
    expect(() => closeInterpolation(new LexerCursor('} "'), context(LexerState.ATTRIBUTE))).toThrow('Interpolation must end with double quotes \'"\', found \' \'');
  });

  it('throws for an unexpected state', () => {
    expect(() => closeInterpolation(new LexerCursor('}'), context(LexerState.EVENT))).toThrow(`Unexpected state '${LexerState.EVENT}' after interpolation expression`);
  });
});
