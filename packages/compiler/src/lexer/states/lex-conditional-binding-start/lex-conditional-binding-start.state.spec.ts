import { describe, expect, it } from 'vitest';
import { LexerCursor } from '../../types/lexer-cursor/lexer-cursor.model';
import { LexerState } from '../../types/lexer-state.enum';
import { TokenType } from '../../types/token-type.enum';
import { LexerTransitionFunctionContext } from '../../types/transition-function/transition-function-context.type';
import { lexConditionalBindingStart } from './lex-conditional-binding-start.state';

const context: LexerTransitionFunctionContext = { history: [], tokens: [] };

describe('lexConditionalBindingStart', () => {
  it('reads the leading condition and consumes the trailing comma', () => {
    const cursor = new LexerCursor('bindPlaceholder(), placeholder="{placeholder()}")');
    const result = lexConditionalBindingStart(cursor, context);
    expect(result).toEqual({
      state: LexerState.CONDITIONAL_BINDING_BODY,
      tokens: [{ type: TokenType.CONDITIONAL_BINDING, parts: ['bindPlaceholder()'] }],
      pushState: true
    });
    expect(cursor.peek()).toBe(' '.charCodeAt(0));
  });
});
