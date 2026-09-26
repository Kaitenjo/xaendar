import { describe, expect, it } from 'vitest';
import { LexerCursor } from '../../types/lexer-cursor/lexer-cursor.model';
import { LexerState } from '../../types/lexer-state.enum';
import { TokenType } from '../../types/token-type.enum';
import { LexerTransitionFunctionContext } from '../../types/transition-function/transition-function-context.type';
import { lexDynamicBindingStart } from './lex-dynamic-binding-start.state';

const context: LexerTransitionFunctionContext = { history: [], tokens: [] };

describe('lexDynamicBindingStart', () => {
  it('reads the leading condition and consumes the trailing comma', () => {
    const cursor = new LexerCursor('bindPlaceholder(), placeholder="{placeholder()}")');
    const result = lexDynamicBindingStart(cursor, context);
    expect(result).toEqual({
      state: LexerState.DYNAMIC_BINDING_BODY,
      tokens: [{ type: TokenType.DYNAMIC_BINDING, parts: ['bindPlaceholder()'] }],
      pushState: true
    });
    expect(cursor.peek()).toBe(' '.charCodeAt(0));
  });
});
