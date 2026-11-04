import { describe, expect, it } from 'vitest';
import { findClosing, findOutside } from './balanced-text.utils';

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

describe('findOutside', () => {
  it.each([
    ['right at the start', '; a', 0, 0],
    ['after the strings and the groups holding it', 'f(\';\', ";", `;`) + [a; b] + { c; }; d', 0, 34],
    ['from the start index on', 'a; b; c', 2, 4]
  ])('finds the character %s', (_name, text, start, expected) => {
    expect(findOutside(text, start, ';')).toBe(expected);
  });

  it.each([
    ['a text without the character', 'a + b'],
    ['a group that is not closed', 'f(a; b'],
    ['a string that is not closed', '\'a; b']
  ])('finds nothing in %s', (_name, text) => {
    expect(findOutside(text, 0, ';')).toBeUndefined();
  });
});
