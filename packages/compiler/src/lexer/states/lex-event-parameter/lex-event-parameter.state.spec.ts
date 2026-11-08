import { describe, expect, it } from 'vitest';
import { LexerCursor } from '../../types/lexer-cursor/lexer-cursor.model';
import { LexerState } from '../../types/lexer-state.enum';
import { TokenType } from '../../types/token-type.enum';
import { LexerTransitionFunctionContext } from '../../types/transition-function/transition-function-context.type';
import { lexEventParameter } from './lex-event-parameter.state';

const context: LexerTransitionFunctionContext = { history: [], tokens: [] };
const conditionalBindingContext: LexerTransitionFunctionContext = {
  history: [LexerState.TAG_OPEN_NAME, LexerState.FLOW_CONTROL_BLOCK],
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

  it('resolves to CONDITIONAL_BINDING_BODY when nested inside a conditional binding', () => {
    const cursor = new LexerCursor('a)"');
    expect(lexEventParameter(cursor, conditionalBindingContext).state).toBe(LexerState.CONDITIONAL_BINDING_BODY);
  });

  it('keeps a comma inside brackets as part of the same parameter', () => {
    const cursor = new LexerCursor('[a,b])"');
    const result = lexEventParameter(cursor, context);
    expect(result.tokens?.map(t => 'parts' in t ? t.parts : undefined)).toEqual([['[a,b]']]);
  });

  it('keeps a comma inside braces as part of the same parameter', () => {
    const cursor = new LexerCursor('{a,b})"');
    const result = lexEventParameter(cursor, context);
    expect(result.tokens?.map(t => 'parts' in t ? t.parts : undefined)).toEqual([['{a,b}']]);
  });

  it('keeps a comma inside double quotes as part of the same parameter', () => {
    const cursor = new LexerCursor('"a,b")"');
    const result = lexEventParameter(cursor, context);
    expect(result.tokens?.map(t => 'parts' in t ? t.parts : undefined)).toEqual([['"a,b"']]);
  });

  it('keeps a comma inside single quotes as part of the same parameter', () => {
    const cursor = new LexerCursor('\'a,b\')"');
    const result = lexEventParameter(cursor, context);
    expect(result.tokens?.map(t => 'parts' in t ? t.parts : undefined)).toEqual([['\'a,b\'']]);
  });

  it('keeps the calls inside a parameter, with their commas, as part of it', () => {
    const cursor = new LexerCursor('item().id,format(a, b()),$event)"');
    const result = lexEventParameter(cursor, context);
    expect(result.tokens?.map(t => 'parts' in t ? t.parts : undefined)).toEqual([['item().id'], ['format(a, b())'], ['$event']]);
  });

  it('keeps the parentheses written in the strings inside a call as part of the parameter', () => {
    const cursor = new LexerCursor('format(\'(\', \')\'))"');
    const result = lexEventParameter(cursor, context);
    expect(result.tokens?.map(t => 'parts' in t ? t.parts : undefined)).toEqual([['format(\'(\', \')\')']]);
  });

  it('ends the parameters at a parenthesis no group of the parameter opened', () => {
    const cursor = new LexerCursor('[a)" ');
    const result = lexEventParameter(cursor, context);
    expect(result.state).toBe(LexerState.TAG_BODY);
    expect(result.tokens?.map(t => 'parts' in t ? t.parts : undefined)).toEqual([['[a']]);
  });

  it('keeps the commas of nested arrays, objects and template literals as part of the same parameter', () => {
    const cursor = new LexerCursor('[[1, 2], 3],{ a: { b: 1 }, c: 2 },`a, ${ f(b, c) }`,x)"');
    const result = lexEventParameter(cursor, context);
    expect(result.tokens?.map(t => 'parts' in t ? t.parts : undefined)).toEqual([['[[1, 2], 3]'], ['{ a: { b: 1 }, c: 2 }'], ['`a, ${ f(b, c) }`'], ['x']]);
  });

  it('leaves out the whitespace around a parameter, before a comma or the closing parenthesis too', () => {
    const cursor = new LexerCursor('param1   , \n param2 \t)"');
    const result = lexEventParameter(cursor, context);
    expect(result.tokens).toEqual([
      { type: TokenType.EVENT_PARAMETER, parts: ['param1'], span: { start: 0, end: 9 } },
      { type: TokenType.EVENT_PARAMETER, parts: ['param2'], span: { start: 13, end: 23 } }
    ]);
  });

  it('does not close a bracket delimiter on a mismatched closing character', () => {
    const cursor = new LexerCursor('[{a}])"');
    const result = lexEventParameter(cursor, context);
    expect(result.tokens?.map(t => 'parts' in t ? t.parts : undefined)).toEqual([['[{a}]']]);
  });

  it('throws when the parameter list is not closed with a double quote', () => {
    const cursor = new LexerCursor(')x');
    expect(() => lexEventParameter(cursor, context)).toThrow('Event must be included in Double Quotes');
  });

  it('emits the parameter and transitions to CAST at the cast of a whole parameter', () => {
    const cursor = new LexerCursor('a, $event.target as HTMLInputElement)"');
    const result = lexEventParameter(cursor, context);

    expect(result.state).toBe(LexerState.CAST);
    expect(result.tokens).toEqual([
      { type: TokenType.EVENT_PARAMETER, parts: ['a'], span: { start: 0, end: 1 } },
      { type: TokenType.EVENT_PARAMETER, parts: ['$event.target'], span: { start: 3, end: 16 } }
    ]);
    expect(cursor.peekMatch(' as HTMLInputElement)"')).toBe(true);
  });

  it('finds the cast after a tab or a line break', () => {
    for (const whitespace of ['\t', '\n', '\r\n']) {
      expect(lexEventParameter(new LexerCursor(`item()${whitespace}as Item)"`), context).state).toBe(LexerState.CAST);
    }
  });

  it('keeps the whitespace of a parameter without cast, and the as written in a call, in a literal or before any expression', () => {
    for (const parameter of ['a + b', 'format(value as string)', '\'x as y\'', 'as T']) {
      const result = lexEventParameter(new LexerCursor(`${parameter})"`), context);
      expect(result.state).toBe(LexerState.TAG_BODY);
      expect(result.tokens?.map(token => 'parts' in token ? token.parts : undefined)).toEqual([[parameter]]);
    }
  });

  it('skips the whitespace before the first parameter', () => {
    expect(lexEventParameter(new LexerCursor(' \n a)"'), context).tokens).toEqual([{ type: TokenType.EVENT_PARAMETER, parts: ['a'], span: { start: 3, end: 6 } }]);
  });
});
