import { describe, expect, it } from 'vitest';
import { LexerCursor } from '../../types/lexer-cursor/lexer-cursor.model';
import { LexerState } from '../../types/lexer-state.enum';
import { TokenType } from '../../types/token-type.enum';
import { LexerTransitionFunctionContext } from '../../types/transition-function/transition-function-context.type';
import { lexEventHandler } from './lex-event-handler.state';

const context: LexerTransitionFunctionContext = { history: [], tokens: [] };
const conditionalBindingContext: LexerTransitionFunctionContext = {
  history: [LexerState.TAG_OPEN_NAME, LexerState.FLOW_CONTROL_BLOCK],
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

  it('transitions to CONDITIONAL_BINDING_BODY when nested inside a conditional binding and the handler has no parameters', () => {
    const cursor = new LexerCursor('onClick()"');
    expect(lexEventHandler(cursor, conditionalBindingContext).state).toBe(LexerState.CONDITIONAL_BINDING_BODY);
  });

  it('throws on a space inside the handler name', () => {
    const cursor = new LexerCursor('on Click()"');
    expect(() => lexEventHandler(cursor, context)).toThrow('No spaces are allowed in event handler name');
  });

  it.each([
    ['a tab', '\t'],
    ['a line feed', '\n'],
    ['a carriage return', '\r']
  ])('throws on %s following the handler name, rather than reading it as part of the name', (_description, whitespace) => {
    const cursor = new LexerCursor(`onClick${whitespace}()"`);
    expect(() => lexEventHandler(cursor, context)).toThrow('No spaces are allowed in event handler name');
  });

  it('throws when the handler name is empty', () => {
    const cursor = new LexerCursor('()"');
    expect(() => lexEventHandler(cursor, context)).toThrow('Event handler cannot be empty');
  });
});
