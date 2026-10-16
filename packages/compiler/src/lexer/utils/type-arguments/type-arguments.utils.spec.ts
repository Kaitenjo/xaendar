import { describe, expect, it } from 'vitest';
import { LESS_THAN, LPAREN } from '../../../costants/chars.constants';
import { LexerCursor } from '../../types/lexer-cursor/lexer-cursor.model';
import { lexTypeArguments } from './type-arguments.utils';

/**
 * Lexes the type arguments of an input, after the character opening them.
 */
const lex = (input: string, open: typeof LESS_THAN | typeof LPAREN) => {
  const cursor = new LexerCursor(input);
  cursor.advance();

  return { text: lexTypeArguments(cursor, open), next: cursor.peek() };
};

describe('lexTypeArguments', () => {
  it.each([
    ['nested generic types', '<Map<string, Array<number>>, Set<T>>x', 'Map<string, Array<number>>, Set<T>'],
    ['the arrow of a function type', '<(value: string) => void>x', '(value: string) => void'],
    ['a literal type holding angle brackets', '<\'a>b\' | "<">x', '\'a>b\' | "<"']
  ])('reads type arguments between angle brackets, with %s', (_description, input, expected) => {
    expect(lex(input, LESS_THAN)).toEqual({ text: expected, next: 'x'.charCodeAt(0) });
  });

  it.each([
    ['nested generic types', '(Map<string, Array<number>>, Set<T>)x', 'Map<string, Array<number>>, Set<T>'],
    ['nested function types', '((value: (item: T) => void) => void, number)x', '(value: (item: T) => void) => void, number'],
    ['a literal type holding parentheses', '(\'a)b\' | `(${string}`)x', '\'a)b\' | `(${string}`']
  ])('reads type arguments between parentheses, with %s', (_description, input, expected) => {
    expect(lex(input, LPAREN)).toEqual({ text: expected, next: 'x'.charCodeAt(0) });
  });

  it.each([
    ['empty', '()'],
    ['blank', '( )']
  ])('throws for %s type arguments', (_description, input) => {
    expect(() => lex(input, LPAREN)).toThrow('Type arguments cannot be empty');
  });

  it('throws when the input ends before the type arguments are closed', () => {
    expect(() => lex('(Map<string, (number)', LPAREN)).toThrow();
  });
});
