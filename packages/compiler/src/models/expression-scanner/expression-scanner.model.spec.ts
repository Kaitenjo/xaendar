import { describe, expect, it } from 'vitest';
import { ExpressionScanner } from './expression-scanner.model';

/**
 * Reads a text with a new scanner.
 */
const scan = (text: string, types?: boolean) => {
  const scanner = new ExpressionScanner(types);
  scanner.readText(text);
  return scanner;
};

/**
 * Tells whether the text ends before a character, after reading what precedes it.
 */
const endsAt = (text: string, terminators: string, types?: boolean) => scan(text.slice(0, -1), types).endsAt(text.charCodeAt(text.length - 1), terminators);

describe('ExpressionScanner', () => {
  it('starts in code, outside of any group', () => {
    const scanner = new ExpressionScanner();

    expect([scanner.isCode, scanner.isTopLevel, scanner.closers]).toEqual([true, true, '']);
  });

  it.each([
    ['a string', 'f(\'a', false, ')'],
    ['an escaped quote in a string', 'f("a\\"', false, ')'],
    ['the text of a template literal', 'f(`a', false, '`)'],
    ['an escaped backtick in a template literal', '`a\\`', false, '`'],
    ['an escaped dollar in a template literal', '`\\${', false, '`']
  ])('is in a literal in %s', (_name, text, isCode, closers) => {
    const scanner = scan(text);

    expect([scanner.isCode, scanner.closers]).toEqual([isCode, closers]);
  });

  it.each([
    ['groups', 'f([{ a', '}])'],
    ['a substitution of a template literal', '`a ${ f(', ')}`'],
    ['a template literal in a substitution', '`a ${ `b ${ c', '}`}`'],
    ['the groups closed by a character matching an outer one', 'f([a)', ''],
    ['a closing character matching no group', 'a) + [b', ']'],
    ['a string closed after an escaped backslash', '\'a\\\\\' + (', ')']
  ])('follows %s', (_name, text, closers) => {
    const scanner = scan(text);

    expect([scanner.isCode, scanner.closers]).toEqual([true, closers]);
  });

  it('reads the angle brackets as groups only in a type, out of an arrow', () => {
    expect(scan('a < b').closers).toBe('');
    expect(scan('Map<string, () => void', true).closers).toBe('>');
    expect(scan('Map<string, () => void>', true).closers).toBe('');
  });

  it('tells whether the scan is outside of any group and literal', () => {
    expect(scan('f(a) + b').isTopLevel).toBe(true);
    expect(scan('f(a').isTopLevel).toBe(false);
    expect(scan('\'a').isTopLevel).toBe(false);
  });

  describe('endsAt', () => {
    it.each([
      ['a separator outside of any group', 'f(a, b) + c,', ',', true],
      ['a separator in a group', 'f(a,', ',', false],
      ['a closing character closing no open group', 'f(a }', '}', true],
      ['a closing character closing an open group', '{ a }', '}', false],
      ['a character that is not a terminator', 'a)', '}', false],
      ['a terminator in a string', '\'a,', ',', false],
      ['a terminator in the text of a template literal', '`a}', '}', false],
      ['a terminator in a substitution of a template literal', '`${ a,', ',', false]
    ])('ends at %s: %s', (_name, text, terminators, expected) => {
      expect(endsAt(text, terminators)).toBe(expected);
    });

    it('ends at the > closing no group of a type, not at the one of an arrow', () => {
      expect(endsAt('Map<string>>', '>', true)).toBe(true);
      expect(endsAt('Map<string>', '>', true)).toBe(false);
      expect(endsAt('() =>', '>', true)).toBe(false);
      expect(endsAt('a >', '>')).toBe(false);
    });
  });
});
