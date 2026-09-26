import { describe, expect, it } from 'vitest';
import { LexerCursor } from '../../types/lexer-cursor/lexer-cursor.model';
import { LexerState } from '../../types/lexer-state.enum';
import { TokenType } from '../../types/token-type.enum';
import { LexerTransitionFunctionContext } from '../../types/transition-function/transition-function-context.type';
import { lexEventParameter } from './lex-event-parameter.state';

const context: LexerTransitionFunctionContext = { history: [], tokens: [] };
const dynamicBindingContext: LexerTransitionFunctionContext = {
  history: [LexerState.DYNAMIC_BINDING_START],
  tokens: []
};

describe('lexEventParameter', () => {
  it('splits plain parameters separated by a comma and terminates on )"', () => {
    const cursor = new LexerCursor('a,b)"');
    const result = lexEventParameter(cursor, context);
    expect(result.state).toBe(LexerState.TAG_BODY);
    expect(result.tokens).toEqual([
      { type: TokenType.EVENT_PARAMETER, parts: ['a'], span: { start: 0, end: 1 } },
      { type: TokenType.EVENT_PARAMETER, parts: ['b'], span: { start: 2, end: 5 } }
    ]);
  });

  it('resolves to DYNAMIC_BINDING_BODY when nested inside a dynamic binding', () => {
    const cursor = new LexerCursor('a)"');
    expect(lexEventParameter(cursor, dynamicBindingContext).state).toBe(LexerState.DYNAMIC_BINDING_BODY);
  });

  it('keeps a comma inside brackets as part of the same parameter', () => {
    const cursor = new LexerCursor('[a,b])"');
    const result = lexEventParameter(cursor, context);
    expect(result.tokens?.map(t => t.parts)).toEqual([['[a,b]']]);
  });

  it('keeps a comma inside braces as part of the same parameter', () => {
    const cursor = new LexerCursor('{a,b})"');
    const result = lexEventParameter(cursor, context);
    expect(result.tokens?.map(t => t.parts)).toEqual([['{a,b}']]);
  });

  it('keeps a comma inside double quotes as part of the same parameter', () => {
    const cursor = new LexerCursor('"a,b")"');
    const result = lexEventParameter(cursor, context);
    expect(result.tokens?.map(t => t.parts)).toEqual([['"a,b"']]);
  });

  it('keeps a comma inside single quotes as part of the same parameter', () => {
    const cursor = new LexerCursor('\'a,b\')"');
    const result = lexEventParameter(cursor, context);
    expect(result.tokens?.map(t => t.parts)).toEqual([['\'a,b\'']]);
  });

  it('closes a parenthesis delimiter opened twice by the same character', () => {
    const cursor = new LexerCursor('(()"');
    const result = lexEventParameter(cursor, context);
    expect(result.tokens?.map(t => t.parts)).toEqual([['((']]);
  });

  it('treats an unmatched closing parenthesis inside an open delimiter as a literal character', () => {
    const cursor = new LexerCursor('[)"a])"');
    const result = lexEventParameter(cursor, context);
    expect(result.tokens?.map(t => t.parts)).toEqual([['["a]']]);
  });

  it('does not close a bracket delimiter on a mismatched closing character', () => {
    const cursor = new LexerCursor('[{a}])"');
    const result = lexEventParameter(cursor, context);
    expect(result.tokens?.map(t => t.parts)).toEqual([['[{a}]']]);
  });

  it('throws when the parameter list is not closed with a double quote', () => {
    const cursor = new LexerCursor(')x');
    expect(() => lexEventParameter(cursor, context)).toThrow('Event must be included in Double Quotes');
  });
});
