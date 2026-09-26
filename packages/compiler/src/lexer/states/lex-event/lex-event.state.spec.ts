import { describe, expect, it } from 'vitest';
import { LexerCursor } from '../../types/lexer-cursor/lexer-cursor.model';
import { LexerState } from '../../types/lexer-state.enum';
import { TokenType } from '../../types/token-type.enum';
import { LexerTransitionFunctionContext } from '../../types/transition-function/transition-function-context.type';
import { lexEvent } from './lex-event.state';

const context: LexerTransitionFunctionContext = { history: [], tokens: [] };

describe('lexEvent', () => {
  it('reads the event name and transitions to EVENT_HANDLER', () => {
    const cursor = new LexerCursor('@click="onClick"');
    expect(lexEvent(cursor, context)).toEqual({
      state: LexerState.EVENT_HANDLER,
      tokens: [{ type: TokenType.EVENT, parts: ['click'] }]
    });
  });

  it('throws on a space inside the event name', () => {
    const cursor = new LexerCursor('@cli ck="onClick"');
    expect(() => lexEvent(cursor, context)).toThrow('No spaces are allowed in event name');
  });

  it('throws when the event name is empty', () => {
    const cursor = new LexerCursor('@="onClick"');
    expect(() => lexEvent(cursor, context)).toThrow('Event name cannot be empty');
  });

  it('throws when the handler is not wrapped in double quotes', () => {
    const cursor = new LexerCursor('@click=onClick');
    expect(() => lexEvent(cursor, context)).toThrow('Event handler must be included in Double Quotes');
  });
});
