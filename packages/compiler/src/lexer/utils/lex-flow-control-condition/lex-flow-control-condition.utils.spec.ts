import { describe, expect, it } from 'vitest';
import { LexerCursor } from '../../types/lexer-cursor/lexer-cursor.model';
import { LexerTransitionFunctionContext } from '../../types/transition-function/transition-function-context.type';
import { addCharacter, lexFlowControlCondition } from './lex-flow-control-condition.utils';

const context: LexerTransitionFunctionContext = { history: [], tokens: [] };

describe('lexFlowControlCondition', () => {
  it('extracts a simple parenthesised expression', () => {
    const cursor = new LexerCursor('(a+b)');
    expect(lexFlowControlCondition(cursor, context)).toBe('a+b');
  });

  it('skips leading whitespace before the opening parenthesis', () => {
    const cursor = new LexerCursor('  (a)');
    expect(lexFlowControlCondition(cursor, context)).toBe('a');
  });

  it('preserves nested parentheses in the extracted expression', () => {
    const cursor = new LexerCursor('((x))');
    expect(lexFlowControlCondition(cursor, context)).toBe('(x)');
  });

  it('throws when the next non-space character is not an opening parenthesis', () => {
    const cursor = new LexerCursor('abc');
    expect(() => lexFlowControlCondition(cursor, context)).toThrow("Expected '(' but got 'a'");
  });
});

describe('addCharacter', () => {
  it('advances the cursor and appends the newly consumed character', () => {
    const cursor = new LexerCursor('ab');
    expect(addCharacter(cursor, 'x')).toBe('xa');
    expect(addCharacter(cursor, 'xa')).toBe('xab');
  });
});
