import { describe, expect, it } from 'vitest';
import { LESS_THAN, LPAREN } from '../../../costants/chars.constant';
import type { ExpressionTextOptions } from '../../types/expression-text-options.type';
import { LexerCursor } from '../../types/lexer-cursor/lexer-cursor.model';
import { lexExpressionText, lexGroup } from './expression-text.utils';

/**
 * Lexes a text, and returns it with the rest of the input, which starts at the character ending it.
 */
const lex = (input: string, terminators: string, options?: ExpressionTextOptions) => {
  const cursor = new LexerCursor(input);
  const text = lexExpressionText(cursor, terminators, options);
  return [text, input.slice(cursor.currentChar.index + 1)];
};

describe('lexExpressionText', () => {
  it('reads up to a terminator, leaving it to consume', () => {
    expect(lex('a + { b: 1 }.b }', '}')).toEqual(['a + { b: 1 }.b ', '}']);
    expect(lex('item().id, b)', ',)')).toEqual(['item().id', ', b)']);
    expect(lex('item().id)"', ',)')).toEqual(['item().id', ')"']);
  });

  it.each([
    ['a call', 'format(a, b), c)', 'format(a, b)'],
    ['nested arrays', '[[1, 2], 3], x)', '[[1, 2], 3]'],
    ['nested objects', '{ a: { b: 1 }, c: 2 }, x)', '{ a: { b: 1 }, c: 2 }'],
    ['strings', '\'a,)\' + "b,)", x)', '\'a,)\' + "b,)"'],
    ['a template literal', '`a, ${ f(b, c) }, \\` d`, x)', '`a, ${ f(b, c) }, \\` d`'],
    ['a template literal nested in a substitution', '`a ${ `),` } b`, x)', '`a ${ `),` } b`'],
    ['a comparison', 'a < b, c > d)', 'a < b']
  ])('reads the terminators inside %s as part of the text', (_name, input, text) => {
    expect(lex(input, ',)')[0]).toBe(text);
  });

  it('ends at a closing terminator no group of the text opened, the groups left open included', () => {
    expect(lex('format(a }', '}')).toEqual(['format(a ', '}']);
    expect(lex('[a)"', ',)')).toEqual(['[a', ')"']);
  });

  it('ends an expression before the whitespace preceding the as of a cast closing it, outside of the groups and the literals', () => {
    expect(lex('first ?? second  as string }', '}', { cast: true })).toEqual(['first ?? second', '  as string }']);
    expect(lex('first as string }', '}')[0]).toBe('first as string ');
    for (const expression of ['format(value as string) ', '\'x as y\' ', '`x as ${ y as z }` ']) {
      expect(lex(`${expression}}`, '}', { cast: true })[0]).toBe(expression);
    }
  });

  it('reads an as before any expression as part of it', () => {
    expect(lex('as T)', ',)', { cast: true })[0]).toBe('as T');
  });

  it('reads the type arguments and the arrows of a type as part of it', () => {
    expect(lex('Map<string, Array<number>>, x)', ',)', { types: true })[0]).toBe('Map<string, Array<number>>');
    expect(lex('Array<(value: number) => void>, x)', ',)', { types: true })[0]).toBe('Array<(value: number) => void>');
  });
});

describe('lexGroup', () => {
  /**
   * Lexes the group of an input, after the character opening it.
   */
  const lexInput = (input: string, open: typeof LESS_THAN | typeof LPAREN) => {
    const cursor = new LexerCursor(input);
    cursor.advance();

    return { text: lexGroup(cursor, open), next: cursor.peek() };
  };

  it.each([
    ['an empty group', '()x', ''],
    ['a blank group', '( )x', ' '],
    ['nested groups and function types', '(item: Item, render: (value: (item: T) => void) => void)x', 'item: Item, render: (value: (item: T) => void) => void'],
    ['strings holding parentheses', '(label: \'a)b\' | `(${string}`)x', 'label: \'a)b\' | `(${string}`'],
    ['strings holding escaped quotes and backslashes', String.raw`(label: 'a\')' | "b\")" | 'c\\')x`, String.raw`label: 'a\')' | "b\")" | 'c\\'`],
    ['a template literal nested in a substitution', '(f(`a ${ `)` } b`), 1)x', 'f(`a ${ `)` } b`), 1']
  ])('reads %s between parentheses, consuming the closing one', (_description, input, expected) => {
    expect(lexInput(input, LPAREN)).toEqual({ text: expected, next: 'x'.charCodeAt(0) });
  });

  it('reads a group between angle brackets, skipping the arrow of a function type', () => {
    expect(lexInput('<Map<string, number>, (value: string) => void>x', LESS_THAN)).toEqual({ text: 'Map<string, number>, (value: string) => void', next: 'x'.charCodeAt(0) });
  });

  it('throws when the input ends before the group is closed', () => {
    expect(() => lexInput('(item: Map<string, (number)', LPAREN)).toThrow();
  });
});
