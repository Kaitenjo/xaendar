import { describe, expect, it } from 'vitest';
import { LexerCursor } from '../../types/lexer-cursor/lexer-cursor.model';
import { LexerState } from '../../types/lexer-state.enum';
import { closeEventParameters } from './event-parameters.utils';

describe('closeEventParameters', () => {
  it('consumes the parenthesis and the double quote, and returns to the bindings of the tag', () => {
    const cursor = new LexerCursor(')" ');

    expect(closeEventParameters(cursor, { history: [], tokens: [] })).toBe(LexerState.TAG_BODY);
    expect(cursor.currentChar.value).toBe('"');
  });

  it('returns to the bindings of the construct the event binding is declared in', () => {
    expect(closeEventParameters(new LexerCursor(')"'), { history: [LexerState.DIRECTIVE], tokens: [] })).toBe(LexerState.DIRECTIVE_BODY);
  });

  it('throws when the parenthesis is not followed by a double quote', () => {
    expect(() => closeEventParameters(new LexerCursor(') "'), { history: [], tokens: [] })).toThrow('Event must be included in Double Quotes');
  });
});
