import { describe, expect, it } from 'vitest';
import { LexerCursor } from '../../types/lexer-cursor/lexer-cursor.model';
import { LexerState } from '../../types/lexer-state.enum';
import { TokenType } from '../../types/token-type.enum';
import { LexerTransitionFunctionContext } from '../../types/transition-function/transition-function-context.type';
import { lexAttributeValue } from './lex-attribute-value.state';

const context: LexerTransitionFunctionContext = { history: [], tokens: [] };
const dynamicBindingContext: LexerTransitionFunctionContext = {
  history: [LexerState.TAG_BODY, LexerState.DYNAMIC_BINDING_START, LexerState.ATTRIBUTE],
  tokens: []
};

describe('lexAttributeValue', () => {
  it('reads the value until the closing double quote and returns to TAG_BODY', () => {
    const cursor = new LexerCursor('foo">');
    expect(lexAttributeValue(cursor, context)).toEqual({
      state: LexerState.TAG_BODY,
      tokens: [{ type: TokenType.ATTRIBUTE_VALUE, parts: ['foo'] }],
      popState: true
    });
  });

  it('transitions to DYNAMIC_BINDING_BODY when nested inside a dynamic binding', () => {
    const cursor = new LexerCursor('foo")');
    expect(lexAttributeValue(cursor, dynamicBindingContext).state).toBe(LexerState.DYNAMIC_BINDING_BODY);
  });
});
