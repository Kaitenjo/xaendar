import { describe, expect, it } from 'vitest';
import { LESS_THAN, LPAREN } from '../../../costants/chars.constant';
import { LexerCursor } from '../../types/lexer-cursor/lexer-cursor.model';
import { lexGroup } from './group.utils';

/**
 * Lexes the group of an input, after the character opening it.
 */
const lex = (input: string, open: typeof LESS_THAN | typeof LPAREN) => {
  const cursor = new LexerCursor(input);
  cursor.advance();

  return { text: lexGroup(cursor, open), next: cursor.peek() };
};

describe('lexGroup', () => {
  it.each([
    ['an empty group', '()x', ''],
    ['a blank group', '( )x', ' '],
    ['nested groups and function types', '(item: Item, render: (value: (item: T) => void) => void)x', 'item: Item, render: (value: (item: T) => void) => void'],
    ['strings holding parentheses', '(label: \'a)b\' | `(${string}`)x', 'label: \'a)b\' | `(${string}`'],
    ['strings holding escaped quotes and backslashes', String.raw`(label: 'a\')' | "b\")" | 'c\\')x`, String.raw`label: 'a\')' | "b\")" | 'c\\'`]
  ])('reads %s between parentheses, consuming the closing one', (_description, input, expected) => {
    expect(lex(input, LPAREN)).toEqual({ text: expected, next: 'x'.charCodeAt(0) });
  });

  it('reads a group between angle brackets, skipping the arrow of a function type', () => {
    expect(lex('<Map<string, number>, (value: string) => void>x', LESS_THAN)).toEqual({ text: 'Map<string, number>, (value: string) => void', next: 'x'.charCodeAt(0) });
  });

  it('throws when the input ends before the group is closed', () => {
    expect(() => lex('(item: Map<string, (number)', LPAREN)).toThrow();
  });
});
