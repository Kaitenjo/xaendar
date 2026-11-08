import { describe, expect, it } from 'vitest';
import { ExpressionScanner } from '../../../models/expression-scanner/expression-scanner.model';
import { findClosing, findEnd, splitTopLevel } from './balanced-text.utils';

describe('findEnd', () => {
  it.each([
    ['right at the start', '; a', 0, 0],
    ['after the strings and the groups holding it', 'f(\';\', ";", `;`) + [a; b] + { c; }; d', 0, 34],
    ['after the template literals nested in a substitution', '`a ${ `;` } b`; c', 0, 14],
    ['from the start index on', 'a; b; c', 2, 4]
  ])('finds the character %s', (_name, text, start, expected) => {
    expect(findEnd(text, start, ';')).toBe(expected);
  });

  it.each([
    ['a text without the character', 'a + b'],
    ['a group that is not closed', 'f(a; b'],
    ['a string that is not closed', '\'a; b']
  ])('finds nothing in %s', (_name, text) => {
    expect(findEnd(text, 0, ';')).toBeUndefined();
  });

  it('stops at the given end, and goes on with the scanner where it stopped', () => {
    const scanner = new ExpressionScanner();
    const text = 'f(a, b) }';

    expect(findEnd(text, 0, '}', scanner, 4)).toBeUndefined();
    expect(scanner.closers).toBe(')');
    expect(findEnd(text, 4, '}', scanner)).toBe(8);
  });
});

describe('findClosing', () => {
  it.each([
    ['a group', '{ a }', 0, 4],
    ['nested groups of the same kind', '{ a: { b } }', 0, 11],
    ['parentheses', 'f(a, (b))', 1, 8],
    ['brackets', '[1, [2]]', 0, 7],
    ['angle brackets', '<string, Map<string, number>>', 0, 28],
    ['the arrow of a function type', '<() => void>', 0, 11],
    ['a closing character in a string', 'f(\')\', ")")', 1, 10],
    ['an escaped quote in a string', 'f("a\\")")', 1, 8],
    ['a closing character in a template literal', '{ `}` }', 0, 6],
    ['a group in a placeholder of a template literal', '{ `a ${ { b: 1 } } c` }', 0, 22],
    ['a template literal nested in a placeholder', '(`a ${ `)` } b`)', 0, 15],
    ['a text that continues after the group', '{ a } tail', 0, 4]
  ])('finds the character closing %s', (_name, text, openIndex, expected) => {
    expect(findClosing(text, openIndex)).toBe(expected);
  });

  it('finds the group that starts later in the text', () => {
    expect(findClosing('x { a } y', 2)).toBe(6);
  });

  it.each([
    ['a group that is not closed', '{ a'],
    ['a string that is not closed', '{ \'a }'],
    ['a template literal that is not closed', '{ `a }'],
    ['a placeholder that is not closed', '{ `${ a` }']
  ])('finds nothing for %s', (_name, text) => {
    expect(findClosing(text, 0)).toBeUndefined();
  });
});

describe('splitTopLevel', () => {
  it('splits on the commas outside of the groups and of the literals, trimming each part', () => {
    const source = ' a, f(b, c), [d, e], { f: 1, g: 2 }, \'h, i\', "j\\", k", `l, m`, `n ${ `o, p` }`';
    const parts = splitTopLevel(source);

    expect(parts.map(({ text }) => text)).toEqual(['a', 'f(b, c)', '[d, e]', '{ f: 1, g: 2 }', '\'h, i\'', '"j\\", k"', '`l, m`', '`n ${ `o, p` }`']);
    expect(parts.every(({ text, start }) => source.startsWith(text, start))).toBe(true);
  });

  it('splits on another separator', () => {
    expect(splitTopLevel('item of f(a; b); track item()', ';').map(({ text }) => text)).toEqual(['item of f(a; b)', 'track item()']);
  });

  it('keeps the commas of the type arguments in a type', () => {
    expect(splitTopLevel('Map<string, number>, () => void', ',', true).map(({ text }) => text)).toEqual(['Map<string, number>', '() => void']);
    expect(splitTopLevel('a < b, c > d').map(({ text }) => text)).toEqual(['a < b', 'c > d']);
  });

  it('returns an empty part for an empty text, and after a trailing separator', () => {
    expect(splitTopLevel('')).toEqual([{ text: '', start: 0 }]);
    expect(splitTopLevel('a,').map(({ text }) => text)).toEqual(['a', '']);
  });
});
