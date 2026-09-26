import { describe, expect, it } from 'vitest';
import { LexerCursor } from '../../types/lexer-cursor/lexer-cursor.model';
import { LexerState } from '../../types/lexer-state.enum';
import { TokenType } from '../../types/token-type.enum';
import { LexerTransitionFunctionContext } from '../../types/transition-function/transition-function-context.type';
import { lexEventHandler } from './lex-event-handler.state';

const context: LexerTransitionFunctionContext = { history: [], tokens: [] };
const dynamicBindingContext: LexerTransitionFunctionContext = {
  history: [LexerState.DYNAMIC_BINDING_START],
  tokens: []
};

describe('lexEventHandler', () => {
  it('reads the handler name and transitions to EVENT_PARAMETER when arguments follow', () => {
    const cursor = new LexerCursor('onClick(e)"');
    expect(lexEventHandler(cursor, context)).toEqual({
      state: LexerState.EVENT_PARAMETER,
      tokens: [{ type: TokenType.EVENT_HANDLER, parts: ['onClick'] }]
    });
  });

  it('transitions directly to TAG_BODY when the handler has no parameters', () => {
    const cursor = new LexerCursor('onClick()"');
    expect(lexEventHandler(cursor, context)).toEqual({
      state: LexerState.TAG_BODY,
      tokens: [{ type: TokenType.EVENT_HANDLER, parts: ['onClick'] }]
    });
  });

  it('transitions to DYNAMIC_BINDING_BODY when nested inside a dynamic binding and the handler has no parameters', () => {
    const cursor = new LexerCursor('onClick()"');
    expect(lexEventHandler(cursor, dynamicBindingContext).state).toBe(LexerState.DYNAMIC_BINDING_BODY);
  });

  it('throws on a space inside the handler name', () => {
    const cursor = new LexerCursor('on Click()"');
    expect(() => lexEventHandler(cursor, context)).toThrow('No spaces are allowed in event handler name');
  });

  it('throws when the handler name is empty', () => {
    const cursor = new LexerCursor('()"');
    expect(() => lexEventHandler(cursor, context)).toThrow('Event handler cannot be empty');
  });
});
