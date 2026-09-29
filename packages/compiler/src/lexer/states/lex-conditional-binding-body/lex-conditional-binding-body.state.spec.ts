import { describe, expect, it } from 'vitest';
import { LexerCursor } from '../../types/lexer-cursor/lexer-cursor.model';
import { LexerState } from '../../types/lexer-state.enum';
import { TokenType } from '../../types/token-type.enum';
import { LexerTransitionFunctionContext } from '../../types/transition-function/transition-function-context.type';
import { lexConditionalBindingBody } from './lex-conditional-binding-body.state';

const context: LexerTransitionFunctionContext = { history: [], tokens: [] };
const nestedConditionalBindingContext: LexerTransitionFunctionContext = {
  history: [LexerState.CONDITIONAL_BINDING_START, LexerState.TAG_BODY],
  tokens: []
};

describe('lexConditionalBindingBody', () => {
  it('transitions to EVENT for a plain @ binding', () => {
    const cursor = new LexerCursor('@click="onClick()"');
    expect(lexConditionalBindingBody(cursor, context)).toEqual({ state: LexerState.EVENT });
  });

  it('transitions to CONDITIONAL_BINDING_START and consumes "@(" for a nested conditional binding', () => {
    const cursor = new LexerCursor('@(nested(), other)');
    const result = lexConditionalBindingBody(cursor, context);
    expect(result).toEqual({ state: LexerState.CONDITIONAL_BINDING_START });
    expect(cursor.peek()).toBe('n'.charCodeAt(0));
  });

  it('skips whitespace between bindings', () => {
    const cursor = new LexerCursor('   placeholder="{value}")');
    expect(lexConditionalBindingBody(cursor, context)).toEqual({ state: LexerState.ATTRIBUTE });
  });

  it('closes the conditional binding and returns to TAG_BODY', () => {
    const cursor = new LexerCursor(')');
    expect(lexConditionalBindingBody(cursor, context)).toEqual({
      state: LexerState.TAG_BODY,
      tokens: [{ type: TokenType.CONDITIONAL_BINDING_CLOSE }],
      popState: true
    });
  });

  it('closes a nested conditional binding and returns to CONDITIONAL_BINDING_BODY', () => {
    const cursor = new LexerCursor(')');
    expect(lexConditionalBindingBody(cursor, nestedConditionalBindingContext).state).toBe(LexerState.CONDITIONAL_BINDING_BODY);
  });

  it('transitions to ATTRIBUTE by default', () => {
    const cursor = new LexerCursor('placeholder="{value}")');
    expect(lexConditionalBindingBody(cursor, context)).toEqual({ state: LexerState.ATTRIBUTE });
  });
});
