import { describe, expect, it } from 'vitest';
import { LexerCursor } from '../../types/lexer-cursor/lexer-cursor.model';
import { LexerState } from '../../types/lexer-state.enum';
import { TokenType } from '../../types/token-type.enum';
import { LexerTransitionFunctionContext } from '../../types/transition-function/transition-function-context.type';
import { lexDynamicBindingBody } from './lex-dynamic-binding-body.state';

const context: LexerTransitionFunctionContext = { history: [], tokens: [] };
const nestedDynamicBindingContext: LexerTransitionFunctionContext = {
  history: [LexerState.DYNAMIC_BINDING_START, LexerState.TAG_BODY],
  tokens: []
};

describe('lexDynamicBindingBody', () => {
  it('transitions to EVENT for a plain @ binding', () => {
    const cursor = new LexerCursor('@click="onClick()"');
    expect(lexDynamicBindingBody(cursor, context)).toEqual({ state: LexerState.EVENT });
  });

  it('transitions to DYNAMIC_BINDING_START and consumes "@(" for a nested dynamic binding', () => {
    const cursor = new LexerCursor('@(nested(), other)');
    const result = lexDynamicBindingBody(cursor, context);
    expect(result).toEqual({ state: LexerState.DYNAMIC_BINDING_START });
    expect(cursor.peek()).toBe('n'.charCodeAt(0));
  });

  it('skips whitespace between bindings', () => {
    const cursor = new LexerCursor('   placeholder="{value}")');
    expect(lexDynamicBindingBody(cursor, context)).toEqual({ state: LexerState.ATTRIBUTE });
  });

  it('closes the dynamic binding and returns to TAG_BODY', () => {
    const cursor = new LexerCursor(')');
    expect(lexDynamicBindingBody(cursor, context)).toEqual({
      state: LexerState.TAG_BODY,
      tokens: [{ type: TokenType.DYNAMIC_BINDING_CLOSE }],
      popState: true
    });
  });

  it('closes a nested dynamic binding and returns to DYNAMIC_BINDING_BODY', () => {
    const cursor = new LexerCursor(')');
    expect(lexDynamicBindingBody(cursor, nestedDynamicBindingContext).state).toBe(LexerState.DYNAMIC_BINDING_BODY);
  });

  it('transitions to ATTRIBUTE by default', () => {
    const cursor = new LexerCursor('placeholder="{value}")');
    expect(lexDynamicBindingBody(cursor, context)).toEqual({ state: LexerState.ATTRIBUTE });
  });
});
